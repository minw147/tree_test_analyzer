// Simple test server for Custom API storage
// Run with: node test-server.js
// Server will start on http://localhost:3001

import http from 'http';
import url from 'url';

const PORT = 3001;
const studies = new Map(); // In-memory storage for testing
const results = new Map(); // Store results by studyId: Map<studyId, ParticipantResult[]>

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const method = req.method;

    console.log(`${method} ${path}`);

    // Health check endpoint
    if (path === '/health' && method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
        return;
    }

    // GET /studies/:id/results - Fetch all results for a study (must be before GET /studies/:id)
    if (path.match(/^\/studies\/(.+)\/results$/) && method === 'GET') {
        const studyId = path.match(/^\/studies\/(.+)\/results$/)[1];
        const studyResults = results.get(studyId) || [];
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(studyResults));
        return;
    }

    // GET /studies/:id/status - Check study status (must be before GET /studies/:id)
    if (path.match(/^\/studies\/(.+)\/status$/) && method === 'GET') {
        const studyId = path.match(/^\/studies\/(.+)\/status$/)[1];
        const study = studies.get(studyId);
        
        if (!study) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'not-found' }));
            return;
        }

        const accessStatus = study.config.accessStatus || 'active';
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: accessStatus }));
        return;
    }

    // GET /studies/:id - Fetch study config (must be after specific routes like /status and /results)
    if (path.match(/^\/studies\/(.+)$/) && method === 'GET') {
        const studyId = path.match(/^\/studies\/(.+)$/)[1];
        const study = studies.get(studyId);
        
        if (!study) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Study not found' }));
            return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(study.config));
        return;
    }

    // PUT /studies/:id - Update study config
    if (path.match(/^\/studies\/(.+)$/) && method === 'PUT') {
        const studyId = path.match(/^\/studies\/(.+)$/)[1];
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const config = JSON.parse(body);
                studies.set(studyId, { config, updatedAt: new Date().toISOString() });
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, id: studyId }));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        return;
    }

    // GET /studies - Fetch all studies (for sync feature)
    if (path === '/studies' && method === 'GET') {
        // Convert Map to array of study configs
        const allStudies = Array.from(studies.values()).map(study => study.config);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(allStudies));
        return;
    }

    // POST /studies - Create new study
    if (path === '/studies' && method === 'POST') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const config = JSON.parse(body);
                const studyId = config.id;
                studies.set(studyId, { config, createdAt: new Date().toISOString() });
                
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, id: studyId }));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        return;
    }


    // PUT /studies/:id/status - Update study status
    if (path.match(/^\/studies\/(.+)\/status$/) && method === 'PUT') {
        const studyId = path.match(/^\/studies\/(.+)\/status$/)[1];
        const study = studies.get(studyId);
        
        if (!study) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Study not found' }));
            return;
        }

        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const { status } = JSON.parse(body);
                study.config.accessStatus = status;
                studies.set(studyId, study);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        return;
    }

    // POST /studies/:id/results - Submit participant results
    if (path.match(/^\/studies\/(.+)\/results$/) && method === 'POST') {
        const studyId = path.match(/^\/studies\/(.+)\/results$/)[1];
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const result = JSON.parse(body);
                console.log('Received result:', result.participantId);
                
                // Store the result
                if (!results.has(studyId)) {
                    results.set(studyId, []);
                }
                results.get(studyId).push(result);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        return;
    }

    // 404 for unknown routes
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
    console.log(`\n✅ Test server running on http://localhost:${PORT}`);
    console.log(`\nEndpoints available:`);
    console.log(`  GET  /health - Health check`);
    console.log(`  GET  /studies - Fetch all studies (for sync)`);
    console.log(`  GET  /studies/:id - Fetch study config`);
    console.log(`  PUT  /studies/:id - Update study config`);
    console.log(`  POST /studies - Create study`);
    console.log(`  GET  /studies/:id/status - Check study status`);
    console.log(`  PUT  /studies/:id/status - Update study status`);
    console.log(`  GET  /studies/:id/results - Fetch all results for a study`);
    console.log(`  POST /studies/:id/results - Submit participant results`);
    console.log(`\n💡 Use this URL in Creator: http://localhost:${PORT}\n`);
});

