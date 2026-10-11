// Single source of truth for the video.
//
// Every scene has a verbatim voice-over line (used for captions), a start/end in
// seconds and a list of anchors: {word, event} pairs that pin each hero event to a
// spoken word. Scenes ask for `cue('collapse')`, never for a hard-coded frame, so
// everything follows the voice.
//
// Without a voice-over the word timings are estimated (~150 words/min).
// `npm run retime` transcribes public/voiceover.(m4a|mp3|wav), aligns it to the
// text and rewrites the block between the markers:
//   - start/end    scene position on the video timeline (seconds)
//   - audio        [from, to, offset]: slice of your recording played by the scene
//   - words        [start, end] per word of voText, on the video timeline
//   - anchors[].at the resolved time of every anchor (seconds, video timeline)
// The block must stay valid JSON.

export type SceneId = 'hook' | 'who' | 'problem' | 'sim' | 'crypto' | 'fix' | 'close';

export type Anchor = {
  /** phrase from voText (case and punctuation are ignored) */
  word: string;
  /** name used by the scene: cue('event') */
  event: string;
  /** which occurrence of the phrase (0 = first) */
  nth?: number;
  /** written by retime: absolute time in seconds */
  at?: number;
};

export type SceneData = {
  id: SceneId;
  start: number;
  end: number;
  voText: string;
  anchors: Anchor[];
  /** seconds kept free after the last word (title card, end card...) */
  minTail?: number;
  /** extra pause (estimate only) after a word, e.g. {"2.3": 0.6} */
  holds?: Record<string, number>;
  audio?: [number, number, number];
  words?: [number, number][];
};

export type ScriptData = {
  voiceover: string | null;
  scenes: SceneData[];
};

// <script-data>
export const DATA: ScriptData = {
  "voiceover": null,
  "scenes": [
    {
      "id": "hook",
      "start": 0,
      "end": 14,
      "minTail": 1.1,
      "voText": "Can an AI trade better than a human? I was sure the answer was yes. Then I started researching, and found something that changed my mind: the best trading AI might just be the luckiest one.",
      "anchors": [
        {"word":"can an ai","event":"question"},
        {"word":"human?","event":"coinLand"},
        {"word":"i was sure","event":"sure"},
        {"word":"yes.","event":"yes"},
        {"word":"researching,","event":"research"},
        {"word":"found something","event":"riser"},
        {"word":"changed my mind","event":"scratch"},
        {"word":"the best trading ai","event":"luckyIn"},
        {"word":"luckiest","event":"title"}
      ]
    },
    {
      "id": "who",
      "start": 14,
      "end": 35,
      "minTail": 0.6,
      "voText": "I’m Andrea, and this is my first research for my Blockchain Focus at TKS. My logic was simple: people lose money because of emotions. Computers have none. And the data backs the first part: in a study of 66,465 households, the most active traders earned 11.4% a year, while the market made 17.9%.",
      "anchors": [
        {"word":"i’m andrea","event":"name"},
        {"word":"first research","event":"first"},
        {"word":"tks.","event":"tks"},
        {"word":"my logic","event":"logic"},
        {"word":"people","event":"human"},
        {"word":"emotions.","event":"burst"},
        {"word":"computers","event":"lucky"},
        {"word":"none.","event":"none"},
        {"word":"the data","event":"data"},
        {"word":"66,465","event":"households"},
        {"word":"most active","event":"race"},
        {"word":"11.4%","event":"stop"},
        {"word":"market made","event":"market"},
        {"word":"17.9%.","event":"final"}
      ]
    },
    {
      "id": "problem",
      "start": 35,
      "end": 57,
      "minTail": 0.6,
      "voText": "But quants warn about something else. When you build a trading model, you test many versions on past data. That test is called a backtest. You keep the best one. But the best one might just be the luckiest. Picture 1,024 people flipping a coin ten times. One gets ten heads. Genius? No. Just lucky.",
      "anchors": [
        {"word":"quants","event":"quants"},
        {"word":"something else:","event":"else"},
        {"word":"trading model","event":"model"},
        {"word":"many versions","event":"versions"},
        {"word":"past data","event":"past"},
        {"word":"backtest.","event":"backtest"},
        {"word":"keep the best","event":"keep"},
        {"word":"luckiest.","event":"luckiest"},
        {"word":"picture","event":"picture"},
        {"word":"1,024","event":"n1024"},
        {"word":"flipping","event":"flipping"},
        {"word":"one gets","event":"oneGets"},
        {"word":"ten heads.","event":"tenHeads"},
        {"word":"genius?","event":"genius"},
        {"word":"no.","event":"no"},
        {"word":"just lucky.","event":"justLucky"}
      ]
    },
    {
      "id": "sim",
      "start": 57,
      "end": 82,
      "minTail": 0.9,
      "holds": {"2.3":0.6},
      "voText": "So I tested it. In Python, I created strategies made of pure random numbers. Zero skill. I score them with the Sharpe ratio: returns divided by risk. Above 2 is excellent. The best of ten scores 1.1. The best of a hundred, 1.8. The best of a thousand, 2.3. Then I run it on a year it has never seen. Result: about zero.",
      "anchors": [
        {"word":"tested it.","event":"tested"},
        {"word":"python,","event":"python"},
        {"word":"pure random numbers.","event":"random"},
        {"word":"zero skill.","event":"zeroSkill"},
        {"word":"sharpe ratio:","event":"sharpe"},
        {"word":"returns divided","event":"divided"},
        {"word":"by risk.","event":"risk"},
        {"word":"above 2","event":"above2"},
        {"word":"best of ten","event":"b10"},
        {"word":"a hundred,","event":"b100"},
        {"word":"a thousand,","event":"b1000"},
        {"word":"2.3.","event":"v23"},
        {"word":"then i run","event":"unseen"},
        {"word":"never seen.","event":"neverSeen"},
        {"word":"result:","event":"result"},
        {"word":"about zero.","event":"collapse"}
      ]
    },
    {
      "id": "crypto",
      "start": 82,
      "end": 92,
      "minTail": 0.6,
      "voText": "In crypto it’s even worse: more than 14,000 of the roughly 24,000 tokens ever listed are dead, and Bitcoin is only about fifteen years old.",
      "anchors": [
        {"word":"in crypto","event":"crypto"},
        {"word":"even worse:","event":"worse"},
        {"word":"14,000","event":"dead14"},
        {"word":"tokens","event":"tokens"},
        {"word":"dead,","event":"dead"},
        {"word":"bitcoin","event":"bitcoin"},
        {"word":"fifteen years","event":"fifteen"}
      ]
    },
    {
      "id": "fix",
      "start": 92,
      "end": 108,
      "minTail": 0.8,
      "voText": "There’s a fix: the Deflated Sharpe Ratio. It asks how many versions you tried. Take a backtest with Sharpe 2.0. If it’s the best of two, there’s a 99% chance it’s real. If it’s the best of a thousand: 34%.",
      "anchors": [
        {"word":"a fix:","event":"fix"},
        {"word":"deflated","event":"dsr"},
        {"word":"how many versions","event":"versions"},
        {"word":"take a backtest","event":"take"},
        {"word":"sharpe 2.0.","event":"sharpe20"},
        {"word":"best of two,","event":"two"},
        {"word":"99%","event":"p99"},
        {"word":"real.","event":"real"},
        {"word":"a thousand:","event":"thousand"},
        {"word":"34%.","event":"p34"}
      ]
    },
    {
      "id": "close",
      "start": 108,
      "end": 124.5,
      "minTail": 2.3,
      "voText": "In the article I also look at who actually tried this, from Renaissance to Numerai, and at the question I can’t answer yet: can a student with a laptop compete with the big funds? The full article is linked below.",
      "anchors": [
        {"word":"in the article","event":"map"},
        {"word":"who actually tried","event":"board"},
        {"word":"renaissance","event":"renaissance"},
        {"word":"numerai,","event":"numerai"},
        {"word":"the question","event":"question"},
        {"word":"can’t answer yet:","event":"shrug"},
        {"word":"can a student","event":"student"},
        {"word":"compete","event":"compete"},
        {"word":"big funds?","event":"flip"},
        {"word":"the full article","event":"end"},
        {"word":"linked below.","event":"below"}
      ]
    }
  ]
};
// </script-data>

export const FPS = 30;
export const SCENES = DATA.scenes;
/** end of the last scene (voice + end card) */
export const STORY_SECONDS = SCENES[SCENES.length - 1].end;
/** the reference slate that closes the video, after the story */
export const OUTRO_SECONDS = 7;
export const TOTAL_SECONDS = STORY_SECONDS + OUTRO_SECONDS;
export const STORY_FRAMES = Math.ceil(STORY_SECONDS * FPS);
export const TOTAL_FRAMES = Math.ceil(TOTAL_SECONDS * FPS);
