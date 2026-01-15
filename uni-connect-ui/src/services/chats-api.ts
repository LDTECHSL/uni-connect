import axios from "axios";
import { getEnv } from "../env";

const API_URL = getEnv().API_URL + "/Chat";

export const getAllChats = async (token: string, userId: number) => {
    try {
        const response = await axios.get(`${API_URL}/conversations/${userId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response;
    } catch (error) {
        throw error;
    }
};

export const getMessagesByChat = async (token: string, chatId: number) => {
    try {
        const response = await axios.get(`${API_URL}/messages/${chatId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response;
    } catch (error) {
        throw error;
    }
}