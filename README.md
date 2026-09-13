# 🎙️ TAKLİT WEB (Çok Oyunculu Dublaj & Ses Taklidi Partisi)

Arkadaşlarınızla lobi kurup katılabileceğiniz, Türk sineması ve popüler dizi/film repliklerini mikrofonunuzla taklit edip komik dublajlar yaptığınız, ardından herkesin performansını sırayla canlı emojiler eşliğinde izleyip en iyiyi oylayarak puan topladığınız gerçek zamanlı web oyunu!

---

## 🚀 Hızlı Başlangıç (Nasıl Çalıştırılır?)

### 1. Tek Komutla Çalıştırma (Üretim & Oynama Modu)
Sunucuyu ve derlenmiş istemciyi tek bir port üzerinden (http://localhost:3001) çalıştırmak için:

```bash
npm start
```

Tarayıcınızdan **`http://localhost:3001`** adresine gidin.

### 2. Geliştirici (Hot-Reload) Modu
Hem sunucuyu hem de React Vite arayüzünü anlık değişiklik takibiyle çalıştırmak için:

```bash
# Terminal 1: Backend Sunucu (Port 3001)
npm run dev:server

# Terminal 2: Frontend Vite (Port 5173)
npm run dev:client
```

---

## 🎮 Oyun Döngüsü & Özellikler

1. **Lobi Sistemi (Lobby & Join Code)**:
   - 5 haneli pratik oda kodu (Örn: `VGZQ6`).
   - Host özel oda ayarları (Tur Sayısı: 3/5/7, Kayıt Süresi, Kategori Seçimi, Oyun Modu).
   - Avatar ve Takma Ad (Nickname) özelleştirme.

2. **1. Aşama: Klip İzleme (Preview)**:
   - Sahneyi, karakteri ve repliği karaoke altyazısı ve taklit ipuçlarıyla birlikte izleyin.

3. **2. Aşama: Mikrofonla Canlı Kayıt (Recording)**:
   - Klip sessiz oynarken tarayıcı mikrofonuyla canlı sesinizi kaydedin.
   - Gerçek zamanlı ses dalgası (visualizer) ve süre geri sayımı.
   - Erken bitirenler için tek tuşla anında gönderme.

4. **3. Aşama: Sırayla Birlikte İzleme (Showcase)**:
   - Her oyuncunun dublajı sırayla tüm odaya video eşliğinde dinletilir!
   - Canlı emoji reaksiyonları (🔥, 😂, 💀, 👏, 🎭, 🏆) ekranda uçar.

5. **4. Aşama: Oylama (Voting)**:
   - Tüm adayların seslerini tekrar önizleyip en komik veya en başarılı performansa oy verin (kendine oy verilemez).

6. **5. Aşama: Liderlik Tablosu & Podyum (Scoreboard & Podium)**:
   - Tur kazananı bonusları, kümülatif puanlar, konfetili 1., 2. ve 3. podyum kutlaması!

---

## 🎬 Dahili Replik Kütüphanesi
- **Kolpaçino**: "Hedef ben miyim Tayfun?"
- **Ezel**: Ramiz Dayı - "Mesele ölmek değil yeğen..."
- **G.O.R.A.**: "Komutan Logar, bir cisim yaklaşıyor efendim!"
- **Kurtlar Vadisi**: Süleyman Çakır - "Bu alemde racon kesmeye değil kafa kesmeye geldik!"
- **Korkusuz Korkak**: Bombacı Mülayim (Kemal Sunal) - "Mesela yani!"
- **Aşk-ı Memnu**: Bihter - "Beni beni, Bihter'ini..."
- **Shrek**: Eşek - "Geldik mi Shrek? Geldik mi?"
- **Recep İvedik**: "Gonuşma laynn!"
- **Matrix**: Morpheus - "Kırmızı hap mı mavi hap mı?"
- **Yeşilçam / Şener Şen**: "Yaz kızım: 200 torba çimento..."

Yeni klip eklemek için `server/clipsData.js` dosyasını düzenleyebilirsiniz.
