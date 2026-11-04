/**
 * API client giao tiếp với backend Module 2
 */

export const getSongs = async () => {
  const res = await fetch('/api/songs');
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Lỗi tải danh sách bài hát (HTTP ${res.status})`);
  }
  return res.json();
};

export const getSongById = async (id) => {
  const res = await fetch(`/api/songs/${id}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Lỗi tải thông tin bài hát (HTTP ${res.status})`);
  }
  return res.json();
};

export const getStreamUrl = (songId) => {
  return `/api/songs/${songId}/stream`;
};
