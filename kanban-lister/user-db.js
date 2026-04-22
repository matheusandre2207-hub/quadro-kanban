const UserDB = {
    // Gera uma chave única para o localStorage baseada no email do usuário
    _getKey: (email) => `lumina_cloud_storage_${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,

    // Busca os dados vinculados ao usuário na "nuvem"
    getUserData: (email) => {
        const data = localStorage.getItem(UserDB._getKey(email));
        return data ? JSON.parse(data) : { events: [], tasks: [], lastEvent: null };
    },

    // Salva os dados do usuário na "nuvem"
    saveUserData: (email, data) => {
        localStorage.setItem(UserDB._getKey(email), JSON.stringify(data));
    }
};