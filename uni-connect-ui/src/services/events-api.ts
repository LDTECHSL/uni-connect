import axios from "axios";
import { getEnv } from "../env";

const API_URL = getEnv().API_URL + "/Event"

export const createEvent = async (eventData: any, token: string) => {
    try {
        const response = await axios.post(`${API_URL}`, eventData, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response;
    } catch (error) {
        throw error;
    }
}

export const getEvents = async (token: string) => {
    try {
        const response = await axios.get(`${API_URL}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response;
    } catch (error) {
        throw error;
    }
}

export const getEventsByUser = async (userId: number, token: string) => {
    try {
        const response = await axios.get(`${API_URL}/${userId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response;
    } catch (error) {
        throw error;
    }
}

export const deleteEvent = async (eventId: number, userId: number, token: string) => {
    try {
        const response = await axios.delete(`${API_URL}/${eventId}/${userId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response;
    } catch (error) {
        throw error;
    }
}