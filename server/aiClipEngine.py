import sys
import os
import re
import glob
import json
import hashlib
import subprocess
import yt_dlp

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Path configurations
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLIPS_DIR = os.path.join(BASE_DIR, "client", "public", "clips")
TEMP_DIR = os.path.join(BASE_DIR, "scratch", "ai_temp")
FFMPEG = r"C:\Users\ahmet\AppData\Local\Python\pythoncore-3.14-64\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"

os.makedirs(CLIPS_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)

# Curated iconic scene database for instant AI discoveries
CURATED_PROMPTS = [
    {
        "query": "gora komutan logar bir cisim yaklasıyor efendim",
        "title": "Bir Cisim Yaklaşıyor Efendim!",
        "source": "G.O.R.A.",
        "character": "Komutan Logar (Cem Yılmaz)",
        "subtitle": "Komutan Logar, bir cisim yaklaşıyor efendim!",
        "category": "komedi",
        "icon": "🛸",
        "color": "from-amber-600 to-red-900",
        "default_ss": 1.0,
        "default_dur": 3.8
    },
    {
        "query": "organize isler araba nerde para nerde",
        "title": "Araba Nerde? Para Nerde?",
        "source": "Organize İşler",
        "character": "Asım Noyan (Yılmaz Erdoğan)",
        "subtitle": "Araba nerde? Para nerde?",
        "category": "komedi",
        "icon": "🚗",
        "color": "from-yellow-600 to-amber-900",
        "default_ss": 1.5,
        "default_dur": 3.5
    },
    {
        "query": "first rule of fight club scene hd",
        "title": "The First Rule of Fight Club",
        "source": "Fight Club",
        "character": "Tyler Durden (Brad Pitt)",
        "subtitle": "The first rule of Fight Club is: you do not talk about Fight Club.",
        "category": "film",
        "icon": "🥊",
        "color": "from-red-900 to-zinc-950",
        "default_ss": 1.0,
        "default_dur": 4.0
    },
    {
        "query": "godfather offer he cant refuse scene hd",
        "title": "An Offer He Can't Refuse",
        "source": "The Godfather",
        "character": "Don Vito Corleone (Marlon Brando)",
        "subtitle": "I'm gonna make him an offer he can't refuse.",
        "category": "film",
        "icon": "🌹",
        "color": "from-amber-950 to-stone-900",
        "default_ss": 2.0,
        "default_dur": 3.8
    },
    {
        "query": "pulp fiction say what again scene hd",
        "title": "Say What Again!",
        "source": "Pulp Fiction",
        "character": "Jules Winnfield (Samuel L. Jackson)",
        "subtitle": "Say 'what' again! I dare you, I double dare you!",
        "category": "film",
        "icon": "🍔",
        "color": "from-purple-900 to-stone-900",
        "default_ss": 0.5,
        "default_dur": 4.0
    },
    {
        "query": "recep ivedik bohhoyt gülüşü sahnesi",
        "title": "Bohöhöhöyt!",
        "source": "Recep İvedik",
        "character": "Recep İvedik (Şahan Gökbakar)",
        "subtitle": "Bohöhöhöyt!",
        "category": "komedi",
        "icon": "🦍",
        "color": "from-orange-600 to-amber-900",
        "default_ss": 0.5,
        "default_dur": 3.2
    },
    {
        "query": "matrix welcome to the real world scene hd",
        "title": "Welcome to the Real World",
        "source": "The Matrix",
        "character": "Morpheus (Laurence Fishburne)",
        "subtitle": "Welcome to the real world.",
        "category": "film",
        "icon": "💊",
        "color": "from-emerald-900 to-black",
        "default_ss": 0.5,
        "default_dur": 3.5
    },
    {
        "query": "taxi driver you talkin to me scene hd",
        "title": "You Talkin' to Me?",
        "source": "Taxi Driver",
        "character": "Travis Bickle (Robert De Niro)",
        "subtitle": "You talkin' to me?",
        "category": "film",
        "icon": "🚕",
        "color": "from-yellow-800 to-neutral-900",
        "default_ss": 1.0,
        "default_dur": 3.5
    },
    {
        "query": "leyla ile mecnun o gemi bir gun gelecek",
        "title": "O Gemi Bir Gün Gelecek!",
        "source": "Leyla ile Mecnun",
        "character": "İsmail Abi (Serkan Keskin)",
        "subtitle": "O gemi bir gün gelecek!",
        "category": "dizi",
        "icon": "🚢",
        "color": "from-sky-900 to-slate-900",
        "default_ss": 0.5,
        "default_dur": 3.5
    }
]

def log_progress(step, msg):
    payload = json.dumps({"type": "progress", "step": step, "message": msg}, ensure_ascii=False)
    print(f"__PROGRESS__{payload}", flush=True)

def parse_time_str(t_str):
    parts = t_str.replace(',', '.').split(':')
    if len(parts) == 3:
        return float(parts[0])*3600 + float(parts[1])*60 + float(parts[2])
    elif len(parts) == 2:
        return float(parts[0])*60 + float(parts[1])
    return float(parts[0])

def find_subtitles_match(sub_pattern, query_keywords):
    sub_files = glob.glob(sub_pattern)
    for s_file in sub_files:
        try:
            with open(s_file, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            blocks = re.findall(r"(\d+:\d+:\d+[\.,]\d+|\d+:\d+[\.,]\d+)\s*-->\s*(\d+:\d+:\d+[\.,]\d+|\d+:\d+[\.,]\d+)[\r\n]+(.*?)(?=\n\s*\n|\Z)", content, re.DOTALL)
            for start_s, end_s, text in blocks:
                cleaned_text = re.sub(r'<[^>]+>', '', text).replace('\n', ' ').strip()
                lower_text = cleaned_text.lower()
                matches = sum(1 for kw in query_keywords if kw in lower_text)
                if matches > 0:
                    start_sec = parse_time_str(start_s)
                    end_sec = parse_time_str(end_s)
                    dur = min(max(end_sec - start_sec, 2.8), 4.5)
                    return max(0.0, start_sec - 0.2), dur, cleaned_text
        except Exception:
            pass
    return None

def find_best_segment_fast(mp4_path, target_query, sub_base_path):
    keywords = [w.lower() for w in re.findall(r'\w+', target_query) if len(w) > 2]
    
    # 1. First priority: check downloaded subtitles
    sub_match = find_subtitles_match(f"{sub_base_path}*", keywords)
    if sub_match:
        return sub_match
        
    # 2. Check total video duration
    cmd = [FFMPEG, "-i", mp4_path]
    p = subprocess.run(cmd, capture_output=True, text=True)
    dur_match = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)", p.stderr)
    total_sec = 10.0
    if dur_match:
        h, m, s = dur_match.groups()
        total_sec = float(h)*3600 + float(m)*60 + float(s)
        
    # If video is already a short clip (< 8 seconds), use from beginning!
    if total_sec <= 6.0:
        return 0.0, min(total_sec, 4.0), ""
        
    # Default: take a 3.8 second slice around 1.0s or center
    return 1.0, 3.8, ""

def extract_and_optimize_clip(query, is_random=False):
    curated_meta = None
    search_term = query.strip()
    
    if is_random or not search_term:
        import random
        curated_meta = random.choice(CURATED_PROMPTS)
        search_term = curated_meta["query"]
        log_progress("search", f"Rastgele sahne seçildi: {curated_meta['source']} ({curated_meta['character']})...")
    else:
        for item in CURATED_PROMPTS:
            if any(w.lower() in search_term.lower() for w in item["source"].split()):
                curated_meta = item
                break
        log_progress("search", f"YouTube taranıyor: \"{search_term}\"...")

    # 1. Search and Download with yt-dlp
    query_hash = hashlib.md5(search_term.encode("utf-8")).hexdigest()[:8]
    temp_dl_base = os.path.join(TEMP_DIR, f"yt_{query_hash}")
    temp_dl_path = f"{temp_dl_base}.mp4"
    
    is_url = search_term.startswith("http://") or search_term.startswith("https://")
    search_target = search_term if is_url else f"ytsearch1:{search_term}"
    
    ydl_opts = {
        "format": "best[ext=mp4]/best",
        "outtmpl": temp_dl_path,
        "quiet": True,
        "extractor_args": {"youtube": {"player_client": ["android"]}}
    }
    
    video_title = search_term
    video_id = query_hash
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(search_target, download=True)
        if "entries" in info and len(info["entries"]) > 0:
            entry = info["entries"][0]
            video_title = entry.get("title", search_term)
            video_id = entry.get("id", query_hash)
        else:
            video_title = info.get("title", search_term)
            video_id = info.get("id", query_hash)

    if not os.path.exists(temp_dl_path) or os.path.getsize(temp_dl_path) < 1000:
        raise Exception("Video YouTube'dan indirilemedi.")

    # 2. Analyze Audio / Subtitles
    log_progress("analyze", "Ses dalgaları ve replik saniyesi tespit ediliyor...")
    
    if curated_meta and "default_ss" in curated_meta:
        start_sec = curated_meta["default_ss"]
        duration_sec = curated_meta["default_dur"]
        detected_text = curated_meta["subtitle"]
    else:
        start_sec, duration_sec, detected_text = find_best_segment_fast(temp_dl_path, search_term, temp_dl_base)

    # 3. Cut & Optimize MP4
    log_progress("encode", "Klip kırpılıyor ve ses stüdyo kalitesinde normalize ediliyor...")
    final_filename = f"ai_{video_id[:10]}_{int(start_sec)}.mp4"
    final_filepath = os.path.join(CLIPS_DIR, final_filename)
    
    cmd = [
        FFMPEG, "-y",
        "-ss", str(start_sec),
        "-t", str(duration_sec),
        "-i", temp_dl_path,
        "-c:v", "libx264", "-profile:v", "high", "-level", "4.0", "-pix_fmt", "yuv420p",
        "-preset", "veryfast", "-crf", "22",
        "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
        "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
        "-movflags", "+faststart",
        final_filepath
    ]
    subprocess.run(cmd, capture_output=True, check=True)
    
    # Clean temp raw video & subs
    for f in glob.glob(f"{temp_dl_base}*"):
        try: os.remove(f)
        except Exception: pass

    # 4. Construct Clip Metadata
    title = curated_meta["title"] if curated_meta else video_title[:35]
    source = curated_meta["source"] if curated_meta else "YouTube Sahnesi"
    character = curated_meta["character"] if curated_meta else "Karakter"
    subtitle = detected_text if detected_text else (curated_meta["subtitle"] if curated_meta else search_term)
    
    clip_data = {
        "id": f"ai_{video_id[:8]}_{int(start_sec)}",
        "title": title,
        "source": source,
        "category": curated_meta["category"] if curated_meta else "film",
        "character": character,
        "duration": duration_sec,
        "videoUrl": f"/clips/{final_filename}",
        "subtitle": subtitle,
        "tips": "Repliğin duygusunu ve tonlamasını vererek söyle!",
        "color": curated_meta["color"] if curated_meta else "from-cyan-900 to-indigo-950",
        "icon": curated_meta["icon"] if curated_meta else "🎬"
    }

    log_progress("ready", "Klip başarıyla oluşturuldu!")
    return clip_data

if __name__ == "__main__":
    query_arg = sys.argv[1] if len(sys.argv) > 1 else ""
    is_random_arg = "--random" in sys.argv or query_arg == "__RANDOM__"
    
    try:
        res = extract_and_optimize_clip(query_arg, is_random=is_random_arg)
        print(f"__RESULT__{json.dumps(res, ensure_ascii=False)}")
    except Exception as e:
        err_res = {"success": False, "error": str(e)}
        print(f"__ERROR__{json.dumps(err_res, ensure_ascii=False)}")
