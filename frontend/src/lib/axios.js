import axios from "axios"

export const axiosInstance = axios.create({
    baseURL:"http://localhost:5001/api",
    withCredentials:true //this will help to send cookie with every req
})