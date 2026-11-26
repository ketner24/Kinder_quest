# Kinder Quest 🦸 🛻 🏎️ 👸

A talking, touch-screen learning adventure for kindergarten. It speaks every question, cheers right answers ("Yes! B is for ball!"), gently corrects wrong ones ("That is D. Can you find B?"), and remembers what each child knows so practice keeps coming back over days and weeks.

It is plain HTML, CSS and JavaScript: no build step, no server code, no accounts. It runs on GitHub Pages, works offline once loaded, and can be added to a tablet's home screen like an app.

## What's inside

| World | Activities |
|---|---|
| 🔤 Letters | ABC Explore, Find the Letter (A–Z), Little Letters (a–z), Big & Little matching, Letter Sounds, First Sounds, ABC Order, Trace Letters |
| 🔢 Numbers | 123 Explore, Find the Number (0–20), How Many? (counting to 20), Tap & Count, More or Less, What Comes Next?, Add It Up (within 10), Take Away (within 10), Trace Numbers, Count to 100 chart |
| 🎨 Colors & Shapes | Color Explore, Find the Color, What Color Is It?, Color Mixing, Shape Explore, Find the Shape (flat and solid shapes) |
| 📖 Reading | Sight Words (50 Dolch words with example sentences), Rhyme Time, Spell It (3-letter words) |
| 🧩 Puzzles | Patterns, Odd One Out, Big & Small, Memory Match |
| 🎪 Play & Explore | Paint studio with theme stamps, plus shortcuts to the explore boards and Memory Match |

**Themes:** Superheroes, Monster Trucks, Race Cars and Princesses. Each has its own learning buddy (original art drawn in SVG), colors, background, sounds, praise words, counting objects and sticker set. Any child can pick any theme and switch whenever they like by tapping their buddy on the home screen.

## How it teaches

- **Spaced repetition.** Every letter, number, word and fact has its own memory box. New things repeat in the same lesson, then the next day, then after 3, 7, 16 and 35 days. A right answer only moves an item up once enough time has passed, so cramming doesn't count; a miss moves it back down.
- **Small steps.** About three new items at a time, each introduced with a "NEW!" card. Answer choices grow from 2 to 4 as an item becomes familiar, and look-alikes (b/d, 6/9, M/W) show up once the basics are known.
- **Always finishes on a success.** After two misses the right answer glows and the child taps it. Counting and adding mistakes trigger "Let's count together!", where each object lights up as it is counted out loud.
- **Learning order.** Harder activities unlock as skills are learned (for example Letter Sounds after 6 big letters, Spell It after 8 letter sounds, Take Away after addition). A grown-up can unlock everything in Settings.
- **Today's Adventure** builds a mixed lesson from the three activities that most need practice right now.
- **Rewards.** A star for every first-try answer, a sticker after every adventure, a new buddy color every 3 adventures, and 22 trophies for milestones such as "Knows all big letters" or "Counts to 20".

## Grown-up Corner (🔒)

Behind a times-table question, so little ones can't get in.

- **Progress:** minutes per day for the last 14 days, accuracy, streak, a color-coded grid for every letter, number, color, shape and sight word, and a "Needs practice" list for each skill.
- **Settings:** voice, speaking speed and pitch, sound effects, questions per adventure, a daily play limit (shows a "Time for a break!" screen), which worlds Today's Adventure uses, and unlock-all.
- **Players:** several children per device, each with their own progress. Rename, change theme, reset or delete.
- **Backup:** save progress to a file and load it on another device.

Progress is stored only in the browser on that device (localStorage). Nothing is sent anywhere. The voice is the device's built-in text-to-speech.

## Put it on GitHub Pages

This folder sits inside a bigger git repository (your home folder), so give it a repository of its own:

1. On github.com, create a new **public** repository, for example `kinder-quest`, with no README.
2. In PowerShell, from this folder:

```powershell
cd "C:\Users\sketn\Documents\my_coding_adventure\Kindergarten_teaching_app"
```

```powershell
git init -b main
```

```powershell
git add .
```

```powershell
git commit -m "Kinder Quest learning app"
```

```powershell
git remote add origin https://github.com/YOUR-USERNAME/kinder-quest.git
```

```powershell
git push -u origin main
```

3. On GitHub, open the repository → **Settings** → **Pages** → under "Build and deployment" pick **Deploy from a branch**, branch **main**, folder **/ (root)**, then **Save**.
4. After a minute or two the app is live at `https://YOUR-USERNAME.github.io/kinder-quest/`.

**On the tablet:** open that address, tap ▶ Play once (this turns on the voice), then use **Add to Home Screen** (Safari share menu on iPad, or the ⋮ menu in Chrome on Android). It then opens full screen and works without internet.

**Updating later:** edit the files, then `git add .`, `git commit -m "..."` and `git push`. If you change any file, also bump `VERSION` in `sw.js` (for example `kq-v2`) so tablets pick up the new version.

## Try it on your computer

Double-clicking `index.html` works, but a local server behaves more like GitHub Pages:

```powershell
python -m http.server 8765
```

Then open http://localhost:8765.

## Best devices and browsers

- iPad (Safari), Android tablets (Chrome), Chromebooks, and Windows/Mac (Chrome or Edge).
- Edge on Windows has very natural voices ("Microsoft Aria/Jenny Online (Natural)"). Pick one under Grown-up Corner → Settings → Voice.
- On iPad, the first tap on ▶ Play turns on speech; this is an Apple rule for all websites.

## Change what it teaches

| To change… | Edit |
|---|---|
| Letter picture words, sounds, sight words, rhymes, spelling words, colors, shapes | `js/data.js` |
| Themes, buddies, praise phrases, stickers, background scenes | `js/themes.js` |
| Activities and what they say | `js/activities.js` (quiz style) and `js/special.js` (tracing, spelling, memory, explore, paint) |
| Spacing intervals, trophies, rewards | `js/progress.js` |
| Look and layout | `css/app.css` |

Fonts: Andika (made for early readers, with the "a" and "g" kids learn to write) and Fredoka, both from Google Fonts. Every picture is an emoji or hand-built SVG, so there are no image files to license.
