import { apiRequest } from "./api";

export const getSongs = (keyword = "") =>
  apiRequest(`/songs${keyword ? `?q=${encodeURIComponent(keyword)}` : ""}`);

export const getAlbums = (keyword = "") =>
  apiRequest(`/albums${keyword ? `?q=${encodeURIComponent(keyword)}` : ""}`);

export const getPlaylists = () => apiRequest("/playlists");

export const getRooms = () => apiRequest("/rooms");
