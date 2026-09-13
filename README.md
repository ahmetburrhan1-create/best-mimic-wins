# 🎙️ Best Mimic Wins (En İyi Taklit Eden Kazansın)

> **Real-Time Multiplayer Voice Mimicry & Dubbing Party Game**
> Arkadaşlarınızla lobi kurup popüler dizi ve film repliklerini mikrofonunuzla taklit ettiğiniz, gizemli kutudan ses değiştirici güçlendirmeler kazandığınız, videoyla senkronize canlı dublajlar yapıp en iyiyi oyladığınız gerçek zamanlı web partisi!

---

## ✨ Ana Özellikler (Key Features)

- 🤖 **AI YouTube Sahne & Replik Kesici**: İstediğin film/dizi adını yaz, yapay zeka YouTube'dan sahneyi bulup milimetrik 1 cümlelik kesiti ses normalizasyonuyla anında kırpsın ve odaya eklesin.
- 📦 **Replik & Sahne Paketleri**:
  - 🌟 **Tüm Replikler (Karma)**
  - 🚬 **Ezel & Behzat & Kurtlar Vadisi** (Racon ve Dizi Sahneleri)
  - 🎭 **Komedi & Yeşilçam** (Kolpaçino, G.O.R.A, Organize İşler, Kemal Sunal, Recep İvedik...)
  - 🎬 **Kült Hollywood** (Fight Club, The Godfather, Breaking Bad, Joker, Scarface...)
  - ➕ **Kendi Paketini Oluştur**: Özel ikon, renk ve temayla sıfırdan replik koleksiyonu oluşturabilme.
- 🔑 **Oyuncu Hesap & Seviye Sistemi**:
  - Güvenli scrypt şifreleme ve kalıcı hesap yönetimi.
  - Seviye ve unvan ilerlemesi: *Acemi Taklitçi* ➔ *Mahalle Raconcusu* ➔ *Usta Dublör* ➔ *Yeşilçam Efsanesi* ➔ *Oscar Adayı*.
  - Galibiyet, toplam puan ve maç istatistikleri takibi.
  - Misafir (Guest) modu ile hesapsız tek tıkla hızlı oyun deneyimi.
- 🎬 **Senkronize Video Dublaj Oynatıcısı**: Oylama ve vitrin aşamasında orijinal film sahnesi sessizce arkada oynarken yarışmacının canlı dublaj sesiyle milimetrik senkronize şekilde izlenir.
- 🎁 **Gizemli Kutu & Ses Güçlendirmeleri**: Robot sesi, helyum, dev canavar, radyo ve stüdyo reverb efektleri.
- 💬 **Canlı Emoji Reaksiyonları & Ses Efektleri**: Sıra sende izlerken odaya anlık emojiler fırlatabilme.

---

## 🚀 Hızlı Başlangıç (Quickstart)

### Gereksinimler
- **Node.js**: v18 veya üstü
- **Python**: 3.9+ (AI YouTube Klip Kesici için `yt-dlp` ve `ffmpeg`)

### 1. Kurulum
```bash
# Proje kök dizininde bağımlılıkları yükleyin
npm install
npm run install:all
```

### 2. Tek Komutla Çalıştırma (Production / Oyun Modu)
Sunucuyu ve derlenmiş React Vite arayüzünü tek bir port üzerinden çalıştırmak için:
```bash
npm start
```
Tarayıcınızdan **`http://localhost:3001`** adresine gidin.

### 3. Geliştirici (Hot-Reload) Modu
```bash
# Terminal 1: Backend Sunucu (Port 3001)
npm run dev:server

# Terminal 2: Frontend Vite (Port 5173)
npm run dev:client
```

---

## 🛠️ Teknoloji Yığını (Tech Stack)

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti, Web Audio API
- **Backend**: Node.js, Express, Socket.IO, Crypto (scryptSync)
- **AI & Video Motoru**: Python 3, yt-dlp, FFmpeg (EBU R128 Loudness Normalization, H.264 FastStart)

---

## 📄 Lisans
MIT License.
