import axios from 'axios';


const API = axios.create({
  baseURL: '/api/v1/repos',
});


export const analyzeRepository = async (repoUrl) => {
  const response = await API.post('/analyze', { repoUrl });
  return response.data;
};


export const getRepositoryById = async (id) => {
  const response = await API.get(`/${id}`);
  return response.data;
};


export const getAllRepositories = async () => {
  const response = await API.get('/');
  return response.data;
};