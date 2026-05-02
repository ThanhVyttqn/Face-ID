import API from './Auth_api';

export const sendAssistantMessageApi = (data) =>
    API.post('/assistant/chat', data);