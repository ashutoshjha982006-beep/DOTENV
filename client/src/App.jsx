import React, { useState } from 'react';
import { analyzeRepository } from './services/api';

function App() {

  const [repoUrl, setRepoUrl] = useState('');


  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(null);

  const [repoData, setRepoData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await analyzeRepository(repoUrl);
      console.log('Backend Response Payload:', res);

      setRepoData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Backend se connect karne me dikkat aayi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '850px', margin: '40px auto', padding: '0 20px', fontFamily: 'sans-serif' }}>
      <h2>The Astral Cartographer - Client Interface</h2>
      <p style={{ color: '#666' }}>Interactive Codebase Architecture & AST Explorer</p>

      {/* 1. Input Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <input
          type="text"
          placeholder="GitHub Repo URL (e.g., https://github.com/expressjs/express)"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          disabled={loading}
          style={{
            flex: 1,
            padding: '10px',
            fontSize: '15px',
            borderRadius: '5px',
            border: '1px solid #ccc'
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 20px',
            fontSize: '15px',
            cursor: loading ? 'not-allowed' : 'pointer',
            background: '#0070f3',
            color: '#fff',
            border: 'none',
            borderRadius: '5px'
          }}
        >
          {loading ? 'Analyzing Codebase...' : 'Fetch & Analyze'}
        </button>
      </form>

      {/* 2. Error Display */}
      {error && (
        <div style={{ marginTop: '20px', padding: '12px', background: '#ffebee', color: '#c62828', borderRadius: '5px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* 3. Backend Connected Data Output */}
      {repoData && (
        <div style={{ marginTop: '30px', padding: '20px', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h3>Repository Details:</h3>
          <p><strong>Repo:</strong> {repoData.owner} / {repoData.name}</p>
          <p>
            <strong>Health Score:</strong>{' '}
            <span style={{ color: repoData.overallHealthScore > 60 ? 'green' : 'red', fontWeight: 'bold' }}>
              {repoData.overallHealthScore} / 100
            </span>
          </p>
          <p><strong>Total Files (Nodes):</strong> {repoData.nodes?.length}</p>
          <p><strong>Total Import Links:</strong> {repoData.links?.length}</p>

          <hr style={{ margin: '15px 0' }} />

          <h4>Raw Backend Payload (Nodes & Links ready for Graph):</h4>
          <pre
            style={{
              background: '#1e1e1e',
              color: '#4ec9b0',
              padding: '15px',
              borderRadius: '6px',
              maxHeight: '300px',
              overflow: 'auto',
              fontSize: '13px'
            }}
          >
            {JSON.stringify(repoData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default App;
