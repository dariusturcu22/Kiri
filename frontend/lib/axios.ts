import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:5045",
  headers: {
    "Content-Type": "application/json",
  },
});
