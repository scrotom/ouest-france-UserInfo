document.getElementById('submit-btn').addEventListener('click', fetchUserData);
document.getElementById('username').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        fetchUserData();
    }
});

async function fetchUserData() {
    const username = document.getElementById('username').value;
    const userInfoDiv = document.getElementById('user-info');
    const groupInfoDiv = document.getElementById('group-info');
    const resultContainer = document.getElementById('result-container');
    const userInfoTitle = document.getElementById('user-info-title');
    const groupInfoTitle = document.getElementById('group-info-title');

    // Hide titles by default
    userInfoTitle.style.display = 'none';
    groupInfoTitle.style.display = 'none';

    if (!username) {
        alert('Veuillez entrer un nom d\'utilisateur.');
        return;
    }

    try {
        // 1. Get the token
        const tokenResponse = await fetch('http://ofr-dev-methjnl-worker.ouest-france.fr:3460/mras_web/rest/auth/login?connectionId=Editorial&username=system&pwd=sysofrpwd&applicationId=Editorial');
        const tokenData = await tokenResponse.json();
        const token = tokenData.token;

        // 2. Use the token to get user information
        const userResponse = await fetch(`http://ofr-dev-methjnl-worker.ouest-france.fr:3460/mras_web/rest/v3/user/${username}?connectionId=Editorial&token=${token}&showGroups=true`);
        const userData = await userResponse.json();

        // Clear previous user and group information
        userInfoDiv.innerHTML = '';
        groupInfoDiv.innerHTML = '';

        if (userData.status === 'success') {
            const userInfo = userData.result;
            resultContainer.style.display = 'block';
            resultContainer.classList.remove('user-not-found');
            
            // Show titles because user was found
            userInfoTitle.style.display = 'block';
            groupInfoTitle.style.display = 'block';
            
            userInfoDiv.innerHTML = `
                <div class="table-container">
                    <table>
                        <tr><th>Nom</th><td>${userInfo.name}</td></tr>
                        <tr><th>Description</th><td>${userInfo.description}</td></tr>
                        <tr><th>Propriétaire</th><td>${userInfo.owner}</td></tr>
                        <tr><th>Créateur</th><td>${userInfo.creator}</td></tr>
                        <tr><th>Dernière modification</th><td>${new Date(userInfo.modified * 1000).toLocaleString()}</td></tr>
                        <tr><th>Dossier de travail</th><td>${userInfo.workFolder}</td></tr>
                        <tr><th>Email</th><td>${userInfo.systemAttributes.props.principalInfo.email.$}</td></tr>
                        <tr><th>Signature</th><td>${userInfo.systemAttributes.props.principalInfo.signature}</td></tr>
                    </table>
                </div>
            `;

            // 3. Display groups
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

            // 4. Logout user
            await fetch(`http://d1methjnlworker01.ouest-france.fr:3460/mras_web/rest/auth/logout?token=${token}`);
        } else {
            resultContainer.style.display = 'block';
            resultContainer.classList.add('user-not-found');
            userInfoDiv.innerHTML = '<div class="error-message">Utilisateur non trouvé.</div>';
        }
    } catch (error) {
        console.error('Erreur:', error);
        resultContainer.style.display = 'block';
        resultContainer.classList.add('user-not-found');
        userInfoDiv.innerHTML = '<div class="error-message">Une erreur s\'est produite. Veuillez réessayer plus tard.</div>';
    }
}
