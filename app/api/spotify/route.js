
import { NextResponse } from "next/server";

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN;

const NOW_PLAYING_ENDPOINT = `https://api.spotify.com/v1/me/player/currently-playing`;
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;

// Cache em memória para o token de acesso (evita flood/429 na API do Spotify)
let cachedAccessToken = null;
let tokenExpiresAt = 0;

// Cache curto em memória para o status atual (15 segundos)
let cachedNowPlaying = null;
let nowPlayingExpiresAt = 0;

const getAccessToken = async () => {
  if (!client_id || !client_secret || !refresh_token) return null;

  const now = Date.now();
  if (cachedAccessToken && now < tokenExpiresAt) {
    return cachedAccessToken;
  }

  const basic = Buffer.from(`${client_id}:${client_secret}`).toString("base64");
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token,
    }),
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  if (data?.access_token) {
    cachedAccessToken = data.access_token;
    // Margem de segurança de 60 segundos antes de expirar
    const expiresIn = typeof data.expires_in === "number" ? data.expires_in : 3600;
    tokenExpiresAt = now + (expiresIn - 60) * 1000;
    return cachedAccessToken;
  }

  return null;
};

export const fetchNowPlaying = async () => {
  const accessToken = await getAccessToken();
  if (!accessToken) return null;

  return fetch(NOW_PLAYING_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    signal: AbortSignal.timeout(8000),
  });
};

export async function GET() {
  try {
    const now = Date.now();
    if (cachedNowPlaying && now < nowPlayingExpiresAt) {
      return NextResponse.json(cachedNowPlaying);
    }

    const response = await fetchNowPlaying();

    if (!response || response.status === 204 || response.status >= 400) {
      const emptyState = { isPlaying: false };
      cachedNowPlaying = emptyState;
      nowPlayingExpiresAt = now + 15000;
      return NextResponse.json(emptyState);
    }

    const song = await response.json();

    if (!song || !song.item) {
      const emptyState = { isPlaying: false };
      cachedNowPlaying = emptyState;
      nowPlayingExpiresAt = now + 15000;
      return NextResponse.json(emptyState);
    }

    const isPlaying = Boolean(song.is_playing);
    const title = song.item.name || "";
    const artist = Array.isArray(song.item.artists)
      ? song.item.artists.map((_artist) => _artist?.name).filter(Boolean).join(", ")
      : "";
    const album = song.item.album?.name || "";
    const albumImageUrl = Array.isArray(song.item.album?.images) && song.item.album.images.length > 0
      ? song.item.album.images[0].url
      : null;
    const songUrl = song.item.external_urls?.spotify || "";

    const payload = {
      album,
      albumImageUrl,
      artist,
      isPlaying,
      songUrl,
      title,
    };

    cachedNowPlaying = payload;
    nowPlayingExpiresAt = now + 15000;

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json({ isPlaying: false }, { status: 500 });
  }
}

