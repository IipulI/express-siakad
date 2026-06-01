import http from 'http';

function makeRequest() {
    const url = 'http://localhost:3000/api/orang-tua/jadwal-akademik/minggu?npm=221106043033';
    console.log(`Sending GET request to ${url}...`);
    
    http.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            console.log(`Response Code: ${res.statusCode}`);
            try {
                console.log('Response Body:', JSON.stringify(JSON.parse(data), null, 2));
            } catch {
                console.log('Response Body (raw):', data);
            }
            process.exit(0);
        });
    }).on('error', (err) => {
        console.error('Request failed:', err.message);
        process.exit(1);
    });
}

makeRequest();
