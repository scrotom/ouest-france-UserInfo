document.getElementById('submit-btn').addEventListener('click', fetchUserData);
document.getElementById('username').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        fetchUserData();
    }
});

//méthode pour vérifier que l'username n'est pas une tentative d'attaque par injection
function validateUsername(username) {
    const regex = /^[a-zA-Z0-9_. -]+$/;
    return regex.test(username);
}

//méthode pour passer le texte recu en string brut, et éviter ainsi les risque d'attaque XSS (< devient &lt par exemple)
function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

async function fetchUserData() {
    const username = document.getElementById('username').value;
    if(!validateUsername(username)) {
        alert('nom d\'utilisateur invalide.')
        return;
    }
    const userInfoDiv = document.getElementById('user-info');
    const groupInfoDiv = document.getElementById('group-info');
    const resultContainer = document.getElementById('result-container');
    const userInfoTitle = document.getElementById('user-info-title');
    const groupInfoTitle = document.getElementById('group-info-title');

    //cacher les titres par défaut
    userInfoTitle.style.display = 'none';
    groupInfoTitle.style.display = 'none';
    //effacer les tableaux avec les informations utilisateurs précédentes
    userInfoDiv.innerHTML = '';
    groupInfoDiv.innerHTML = '';

    if (!username) {
        alert('Veuillez entrer un nom d\'utilisateur.');
        return;
    }

    try {
        //recuperation du token
        const tokenResponse = await fetch('http://ofr-dev-methjnl-worker.ouest-france.fr:3460/mras_web/rest/auth/login?connectionId=Editorial&username=system&pwd=sysofrpwd&applicationId=Editorial');

        if (!tokenResponse.ok) {
            throw new Error('Erreur lors de la récupération du token');
        }

        const tokenData = await tokenResponse.json();
        const token = tokenData.token;

        //recuperer les informations de l'utilisateur grace au token
        const userResponse = await fetch(`http://ofr-dev-methjnl-worker.ouest-france.fr:3460/mras_web/rest/v3/user/${username}?connectionId=Editorial&token=${token}&showGroups=true`);

        if (!userResponse.ok) {
            if (userResponse.status === 404) {
                throw new Error('Utilisateur non trouvé');
            } else {
                throw new Error('Erreur lors de la récupération des informations utilisateur');
            }
        }

        const userData = await userResponse.json();

        if (userData.status === 'success') {
            const userInfo = userData.result;
            resultContainer.style.display = 'block';
            resultContainer.classList.remove('user-not-found');
            
            //afficher les titres des tableau
            userInfoTitle.style.display = 'block';
            groupInfoTitle.style.display = 'block';
            
            //afficher le tableau des informations utilisateurs générales
            userInfoDiv.innerHTML = `
            <div class="table-container">
                <table>
                    <tr><th>Nom</th><td>${sanitizeHTML(userInfo.name)}</td></tr>
                    <tr><th>Description</th><td>${sanitizeHTML(userInfo.description)}</td></tr>
                    <tr><th>Propriétaire</th><td>${sanitizeHTML(userInfo.owner)}</td></tr>
                    <tr><th>Créateur</th><td>${sanitizeHTML(userInfo.creator)}</td></tr>
                    <tr><th>Dernière modification</th><td>${sanitizeHTML(new Date(userInfo.modified * 1000).toLocaleString())}</td></tr>
                    <tr><th>Dossier de travail</th><td>${sanitizeHTML(userInfo.workFolder)}</td></tr>
                    <tr><th>Email</th><td>${sanitizeHTML(userInfo.systemAttributes.props.principalInfo.email.$)}</td></tr>
                    <tr><th>Signature</th><td>${sanitizeHTML(userInfo.systemAttributes.props.principalInfo.signature)}</td></tr>
                </table>
            </div>
        `;

            //afficher les tableaux des groupes
            userInfo.groups.forEach(group => {
                groupInfoDiv.innerHTML += `
                    <div class="table-container">
                        <table>
                            <tr><th>Type</th><td>${group.type}</td></tr>
                            <tr><th>Nom</th><td>${group.name}</td></tr>
                            <tr><th>Description</th><td>${group.description}</td></tr>
                        </table>
                    </div>
                `;
            });

            //deconnexion de l'api
            const logoutResponse = await fetch(`http://d1methjnlworker01.ouest-france.fr:3460/mras_web/rest/auth/logout?token=${token}`);
            if (!logoutResponse.ok) {
                console.warn('Erreur lors de la déconnexion de l\'API');
            }
        } else {
            resultContainer.style.display = 'block';
            resultContainer.classList.add('user-not-found');
            userInfoDiv.innerHTML = '<div class="error-message">Utilisateur non trouvé.</div>';
        }
    } catch (error) {
        console.error('Erreur:', error);
        resultContainer.style.display = 'block';
        resultContainer.classList.add('user-not-found');
        userInfoDiv.innerHTML = `<div class="error-message">${error.message}</div>`;
    }
}
