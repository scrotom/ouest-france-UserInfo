document.getElementById('submit-btn').addEventListener('click', fetchUserData);
document.getElementById('username').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        fetchUserData();
    }
});

async function fetchUserData() {
    const username = document.getElementById('username').value;
    const resultDiv = document.getElementById('result');
    const resultContainer = document.getElementById('result-container');

    if (!username) {
        alert('Veuillez entrer un nom d\'utilisateur.');
        return;
    }

    try {
        //obtention du token
        const tokenResponse = await fetch('http://ofr-dev-methjnl-worker.ouest-france.fr:3460/mras_web/rest/auth/login?connectionId=Editorial&username=system&pwd=sysofrpwd&applicationId=Editorial');
        const tokenData = await tokenResponse.json();
        const token = tokenData.token;

        //obtention des info user
        const userResponse = await fetch(`http://ofr-dev-methjnl-worker.ouest-france.fr:3460/mras_web/rest/v3/user/${username}?connectionId=Editorial&token=${token}&showGroups=true`);
        const userData = await userResponse.json();

        if (userData.status === 'success') {
            const userInfo = userData.result;
            resultContainer.style.display = 'block';
            resultDiv.innerHTML = `
                <tr><th>Nom</th><td>${userInfo.name}</td></tr>
                <tr><th>Description</th><td>${userInfo.description}</td></tr>
                <tr><th>Dernière modification</th><td>${new Date(userInfo.modified * 1000).toLocaleString()}</td></tr>
                <tr><th>Dossier de travail</th><td>${userInfo.workFolder}</td></tr>
                <tr><th>Email</th><td>${userInfo.systemAttributes.props.principalInfo.email.$}</td></tr>
                <tr><th>Signature</th><td>${userInfo.systemAttributes.props.principalInfo.signature}</td></tr>
                <tr><th>Equipe</th><td>${userInfo.virtualAttributes.va.default_team}</td></tr>
            `;

            //deconnexion user
            await fetch(`http://d1methjnlworker01.ouest-france.fr:3460/mras_web/rest/auth/logout?token=${token}`);
        } else {
            resultContainer.style.display = 'block';
            resultDiv.innerHTML = '<tr><td colspan="2">Utilisateur non trouvé.</td></tr>';
        }
    } catch (error) {
        console.error('Erreur:', error);
        resultContainer.style.display = 'block';
        resultDiv.innerHTML = '<tr><td colspan="2">Une erreur s\'est produite. Veuillez réessayer plus tard.</td></tr>';
    }
}
