import Link from 'next/link';
import styles from '@/components/home/field-guide.module.css';

const chapters = [
  ['build-a-team', 'Build a team'],
  ['stats-and-speed', 'Stats and speed'],
  ['type-matchups', 'Type matchups'],
  ['battle-rules', 'What is simplified'],
] as const;

/** Server-rendered guide under the battle tool, so the page explains itself to readers and search engines. */
export function ShowdownGuide() {
  return (
    <section className={styles.guide} aria-labelledby="showdown-guide-title">
      <header className={styles.header}>
        <h2 id="showdown-guide-title">Pokémon battles.<br />One move at a time.</h2>
        <p>A guide to the Pokéfame battle simulator: build two teams, control both sides, and see how stats and types decide a fight.</p>
      </header>
      <div className={styles.layout}>
        <nav className={`meta ${styles.contents}`} aria-label="Battle simulator guide">
          <p>Inside the guide</p>
          {chapters.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
          <Link href="/cards" className={styles.destination}>Browse Pokémon cards ↗</Link>
          <Link href="/#field-guide" className={styles.destination}>Read the collector’s guide ↗</Link>
        </nav>
        <div className={styles.chapters}>
          <section id="build-a-team">
            <h3>Build a Pokémon team in your browser</h3>
            <p>Search for any Pokémon by name and add up to six to each side. Both teams are yours to control, so you can test a favorite lineup against a rival you design, recreate a matchup you remember, or simply see which of two Pokémon comes out ahead. Use the randomize button to fill the opponent’s team when you want a surprise.</p>
            <p>Each Pokémon arrives with up to four moves, the ones it knows at level 50. You can swap any of them in the builder for other moves it can learn, including TM, tutor and inherited attacks. Drag the Poké Balls to change the order: the first ball leads, and the next one enters when a Pokémon faints.</p>
          </section>
          <section id="stats-and-speed">
            <h3>How stats and speed decide each round</h3>
            <p>Every Pokémon fights at level 50 with the same individual values and no training, so a battle compares the species themselves. You make the opening move, then Speed, including any stat changes, sets the order of attacks in each later round. Attack and Special Attack raise the damage a move deals, while Defense and Special Defense reduce what a Pokémon takes. HP is how much damage it can absorb before it faints.</p>
            <p>That is why a fast, fragile attacker can win one matchup and lose the next: striking first only helps if the hit lands hard enough before the opponent replies. Moves that raise or lower stats can swing that order.</p>
            <p>Pokémon with a Mega Evolution (or a Primal form) can change once per battle: select the Mega Stone, then a move. The new form's types and higher stats take over straight away, with its Speed counting from the next turn; HP stays the same and no Mega Stone item is needed.</p>
          </section>
          <section id="type-matchups">
            <h3>Learn type matchups by playing them</h3>
            <p>Type effectiveness multiplies damage. A Water move against a Fire-type Pokémon is super effective, the reverse is not very effective, and some combinations have no effect at all. Dual-type Pokémon combine both multipliers, so a single move can deal four times or a quarter of its usual damage. Moves that share a type with the Pokémon using them also hit harder.</p>
            <p>Once both teams have a Pokémon, the preview under the arena counts how many of the other side’s Pokémon each team can hit super-effectively, so you can spot a lopsided matchup before you press Fight.</p>
          </section>
          <section id="battle-rules">
            <h3>What this simulator leaves out</h3>
            <p>This is a simplified, local battle simulator. Status conditions, abilities, items, weather and move priority are not part of its rules, and there is no online matchmaking: both teams play in the same browser. Moves have PP, and a Pokémon that runs out uses Struggle. Accuracy, critical hits (as in the Gen 4 games) and damage rolls still apply, so a rematch can end differently.</p>
            <p>Pokéfame’s battle tool is separate from the Pokémon Showdown service. Pokémon stats, moves and artwork come from PokéAPI.</p>
          </section>
        </div>
      </div>
    </section>
  );
}
