import defaultCoverImg from "../assets/default-cover.png";

export const DEFAULT_COVER = defaultCoverImg;

export function getCoverUrl(url) {
  if (!url || typeof url !== "string" || url.trim() === "") {
    return DEFAULT_COVER;
  }
  return url;
}
