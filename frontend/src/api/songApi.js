/**
 * API client giao tiếp với backend Module 2
 */

export const getSongs = async () => {
  const res = await fetch('http://localhost:3000/api/songs');
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Lỗi tải danh sách bài hát (HTTP ${res.status})`);
  }
  return res.json();
};

export const getSongById = async (id) => {
  const res = await fetch(`http://localhost:3000/api/songs/${id}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Lỗi tải thông tin bài hát (HTTP ${res.status})`);
  }
  return res.json();
};

export const getStreamUrl = (songId) => {
  // Trỏ trực tiếp cổng 3000 của backend để stream nhạc HTTP 206
  return `http://localhost:3000/api/songs/${songId}/stream`;
};
