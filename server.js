require('dotenv').config();
const express = require('express');

const app = express();

// 🔥 Função para limpar nome do filme
function formatMovieName(filename) {
    return filename
        .replace(/\.(mkv|mp4|avi)$/i, '') // remove extensão
        .replace(/\s*(Dublado|Dual Áudio|Legendado).*$/i, '') // remove idioma e qualidade
        .replace(/\.(\d{4})/, ' ($1)') // transforma .2017 em (2017)
        .replace(/\s+/g, ' ')
        .trim();
}

app.use(express.static('public'));

app.get('/api/movies', async (req, res) => {
    try {
        const { GOOGLE_API_KEY, FOLDER_ID } = process.env;

        if (!GOOGLE_API_KEY || !FOLDER_ID) {
            return res.status(400).json({ error: "Variáveis .env não configuradas" });
        }

        let result = [];

        // 🔹 Buscar vídeos direto na pasta principal
        const mainVideosRes = await fetch(
            `https://www.googleapis.com/drive/v3/files?q='${FOLDER_ID}'+in+parents+and+mimeType+contains+'video'&key=${GOOGLE_API_KEY}&fields=files(id,name)`
        );

        const mainVideosData = await mainVideosRes.json();

        if (mainVideosData.files && mainVideosData.files.length > 0) {
            result.push({
                category: "Filmes",
                videos: mainVideosData.files.map(file => ({
                    id: file.id,
                    name: formatMovieName(file.name)
                }))
            });
        }

        // 🔹 Buscar subpastas
        const foldersRes = await fetch(
            `https://www.googleapis.com/drive/v3/files?q='${FOLDER_ID}'+in+parents+and+mimeType='application/vnd.google-apps.folder'&key=${GOOGLE_API_KEY}&fields=files(id,name)`
        );

        const foldersData = await foldersRes.json();

        for (let folder of foldersData.files || []) {

            const videosRes = await fetch(
                `https://www.googleapis.com/drive/v3/files?q='${folder.id}'+in+parents+and+mimeType+contains+'video'&key=${GOOGLE_API_KEY}&fields=files(id,name)`
            );

            const videosData = await videosRes.json();

            if (videosData.files && videosData.files.length > 0) {
                result.push({
                    category: folder.name,
                    videos: videosData.files.map(file => ({
                        id: file.id,
                        name: formatMovieName(file.name)
                    }))
                });
            }
        }

        res.json(result);

    } catch (error) {
        console.error("Erro interno:", error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`🔥 Rodando em http://localhost:${process.env.PORT || 3000}`);
});