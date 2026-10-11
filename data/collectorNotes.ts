export interface CollectorNote {
  appeal: string;
  check: string;
  collect: string;
}

/** Editorial collecting ideas, kept separate from official rarity and market data. */
export const COLLECTOR_NOTES: Record<string, CollectorNote> = {
  'ex8-107': {
    appeal: 'A black Rayquaza, a gold star beside its name, and artwork that breaks out of the frame. An expressive centrepiece for a Rayquaza or EX-era collection.',
    check: 'Match Deoxys #107 and the star in the name. Inspect the foil, yellow borders and back for scratches, whitening and creases; compare the same printing and condition.',
    collect: 'Build a Rayquaza page across different eras, or make this the focal point of a Gold Star collection.',
  },
  'swsh7-215': {
    appeal: 'The moon-reaching Umbreon VMAX artwork, often nicknamed “Moonbreon”. Its full-card scene makes this a natural centrepiece for an Eeveelution binder.',
    check: 'Match #215 in Evolving Skies. The regular Umbreon VMAX #95 is a different collectible even though the Pokémon name is the same.',
    collect: 'Pair it with the regular #95 print already in the Vault to compare two approaches to the same Pokémon.',
  },
  'neo4-107': {
    appeal: 'Shining Charizard brings the black Charizard colour scheme into the yellow-border Neo era. The Shining name is part of this specific card’s identity.',
    check: 'Match Neo Destiny #107 and check for a 1st Edition stamp. Edition and surface condition need to match any price comparison.',
    collect: 'Build a Shining Pokémon page, or compare vintage Charizard with the modern versions in this Vault.',
  },
  'sv3pt5-199': {
    appeal: 'Charizard flying through a warm, open landscape. This special illustration rare gives the artwork the full card, making it an art-led addition to a 151 collection.',
    check: 'Match #199, not the regular Charizard ex #6. Check texture, centering and the corners on the actual copy.',
    collect: 'Follow the Charmander evolution line, or build a page around the original three partner Pokémon.',
  },
  'sv3pt5-205': {
    appeal: 'A gold-finished Mew ex for a collection built around Mew or gold card designs. Its Hyper Rare identity distinguishes it from the other Mew ex prints in 151.',
    check: 'Match #205 and inspect the surface in angled light. Keep different Mew ex numbers and product variants separate when comparing prices.',
    collect: 'Use it as the gold accent on a Mew page or in a collection of 151’s different art treatments.',
  },
  'sv4pt5-234': {
    appeal: 'A special illustration rare Charizard ex from Paldean Fates. It adds another visual treatment to a collection following Charizard through modern releases.',
    check: 'Match Paldean Fates #234. Other Charizard ex cards share the name but have different artwork, numbers and prices.',
    collect: 'Compare it with 151’s Charizard ex #199 to make a two-card study of the same Pokémon.',
  },
  'sv8-238': {
    appeal: 'Pikachu ex in a bright, crystal-like special illustration rare treatment. A vivid contrast to the small framed artwork of vintage Pikachu cards.',
    check: 'Match Surging Sparks #238 and the English printing. Inspect the texture and edges instead of relying on a listing’s title alone.',
    collect: 'Place it alongside the Base Set and 151 Pikachu cards in this Vault to show the design changing over time.',
  },
  'swsh11-186': {
    appeal: 'Giratina V fills the frame with an intricate, otherworldly scene. This is a strong pick for someone who collects illustration as much as Pokémon characters.',
    check: 'Match Lost Origin #186. Other Giratina V prints are separate cards; compare the exact artwork and number.',
    collect: 'Follow the credited illustrator, or build a page of Legendary Pokémon with full-card scenery.',
  },
  'swsh12-186': {
    appeal: 'Lugia V takes the Legendary Pokémon into a full-card scene. It offers a modern counterpart to the Neo Genesis Lugia also held in the Vault.',
    check: 'Match Silver Tempest #186. Check centering, surface texture and corners on the copy you are considering.',
    collect: 'Pair it with Neo Genesis Lugia for a vintage-to-modern display.',
  },
  'sv3pt5-6': {
    appeal: 'The regular Double Rare Charizard ex in 151. It lets a Charizard collection include the main-set design as well as the special illustration version.',
    check: 'Match #6. Do not use the price of #199 merely because both cards are named Charizard ex.',
    collect: 'Add 151 Charmander and Charmeleon from this Vault to complete the evolution line.',
  },
  'swsh7-95': {
    appeal: 'The regular Umbreon VMAX from Evolving Skies. A different visual take on Umbreon from the moon-themed #215 print.',
    check: 'Match #95 and the artwork. The name Umbreon VMAX alone is not enough to identify a price.',
    collect: 'Start an Umbreon or Eeveelution page, then compare its different VMAX illustrations.',
  },
  'base1-4': {
    appeal: 'Base Set Charizard brings together the original yellow border, framed holographic artwork and an instantly recognisable Pokémon. A focal point for a first-generation binder.',
    check: 'Distinguish 1st Edition, shadowless and unlimited printings. Inspect foil scratches and back-edge wear; the catalog image does not certify a seller’s copy.',
    collect: 'Pair it with Base Set Charmander and Charmeleon, or with Blastoise and Venusaur.',
  },
  'base1-2': {
    appeal: 'Base Set’s holographic Blastoise completes the Squirtle evolution line. Its classic framed artwork sits naturally beside Charizard and Venusaur.',
    check: 'Check the edition stamp and artwork-frame shadow, then compare the same printing and condition. Foil scratches can be easy to miss in a straight-on photo.',
    collect: 'Add Squirtle and Wartortle from this Vault for a three-card evolution display.',
  },
  'base1-15': {
    appeal: 'The holographic final evolution of Base Set’s Bulbasaur line. A natural companion to the other original partner Pokémon.',
    check: 'Match Base Set #15 and verify the edition. Ask for angled foil photos and a clear image of the back.',
    collect: 'Pair with Base Set Bulbasaur and Ivysaur, then compare them with their 151 versions.',
  },
  'base1-10': {
    appeal: 'Base Set Mewtwo combines a first-generation Legendary Pokémon with the classic holographic frame. It works as a standalone favourite or a Base Set checklist card.',
    check: 'Match Base Set #10 and the edition. Surface scratches and whitening should be assessed on the individual card.',
    collect: 'Start a Mewtwo page across different sets, or include it in a collection of vintage holographic cards.',
  },
  'neo1-9': {
    appeal: 'Neo Genesis Lugia is a vintage holographic interpretation of the Johto Legendary Pokémon. It gives a Lugia collection a distinct early-era anchor.',
    check: 'Match #9 and distinguish 1st Edition from unlimited. Inspect the holo surface and compare matching-condition copies.',
    collect: 'Pair it with Silver Tempest Lugia V already in the Vault.',
  },
  'gym2-2': {
    appeal: 'Blaine’s Charizard ties the Pokémon to a named Gym Leader. That trainer connection gives a collection a theme beyond species alone.',
    check: 'Match Gym Challenge #2 and the edition stamp. Blaine’s Charizard is a different card from Base Set Charizard.',
    collect: 'Build around Blaine’s Pokémon, or compare trainer-owned cards with their standard counterparts.',
  },
  'base1-20': {
    appeal: 'A non-holographic rare from Base Set. Electabuzz shows why a vintage checklist includes more than the familiar holographic cards.',
    check: 'Match #20 and the edition. A rare star does not by itself mean that the card should have a holographic finish.',
    collect: 'Fill a Base Set checklist or start an Electric-type page alongside Pikachu.',
  },
  'base1-17': {
    appeal: 'Base Set Beedrill is a non-holographic rare and the final Pokémon in its evolution line. A useful piece of a complete early-era binder.',
    check: 'Match #17 and the printing. Look for creases and edge wear even when the non-foil surface appears clean.',
    collect: 'Build its evolution line or a page of Base Set’s non-holographic rares.',
  },
  'base1-24': {
    appeal: 'The middle step between Base Set Charmander and Charizard. It makes an evolution page feel complete rather than focused only on the final form.',
    check: 'Match Base Set #24, then check edition, corners and back edges. Uncommon is the official rarity category, not a condition rating.',
    collect: 'Pair with Base Set Charmander and Charizard already in the Vault.',
  },
  'base1-30': {
    appeal: 'Base Set Ivysaur bridges Bulbasaur and Venusaur. A character-led collection can give this uncommon as much attention as the holographic final evolution.',
    check: 'Match Base Set #30 and the printing. Check the back for whitening and the face for handling marks.',
    collect: 'Complete the vintage Bulbasaur line, or compare with 151’s Ivysaur.',
  },
  'base1-42': {
    appeal: 'Base Set Wartortle is the middle evolution on a classic Squirtle binder page. Its value to a collection can simply be completing that story.',
    check: 'Match Base Set #42 and the edition. Use close photographs to judge corners and creases.',
    collect: 'Place it between Squirtle and Blastoise, both already in this Vault.',
  },
  'sv3pt5-2': {
    appeal: 'A modern Ivysaur in 151’s return to the original Pokémon. It offers a straightforward way to collect a favourite evolution line.',
    check: 'Match #2 and distinguish the normal and reverse-holo versions. The finish associated with this estimate is shown in the price panel.',
    collect: 'Pair with 151 Bulbasaur, or compare it with Base Set Ivysaur.',
  },
  'sv3pt5-5': {
    appeal: '151’s regular Charmeleon connects its Charmander and Charizard ex cards. A satisfying checklist addition for an evolution-focused binder.',
    check: 'Match #5 and the normal or reverse-holo finish. Other Charmeleon artwork in the set has a different number.',
    collect: 'Build the 151 line using Charmander #4 and Charizard ex #6.',
  },
  'base1-58': {
    appeal: 'Base Set Pikachu is an early interpretation of Pokémon’s mascot. Small print details make identifying the exact copy part of the collecting interest.',
    check: 'Check cheek colour, edition stamp and frame shadow. Catalog #58 alone does not establish a red-cheeks variant or its price.',
    collect: 'Compare the vintage design with 151 Pikachu and Surging Sparks Pikachu ex in the Vault.',
  },
  'base1-46': {
    appeal: 'Base Set Charmander is the first card in a classic three-stage evolution display. Nostalgia and a favourite character can be enough reason to collect a common.',
    check: 'Match #46 and identify the edition. Inspect edges and creases before comparing it with clean-looking listings.',
    collect: 'Add Base Set Charmeleon and Charizard to complete the line.',
  },
  'base1-44': {
    appeal: 'Base Set Bulbasaur brings the original Grass-type partner to a vintage binder. A natural starting point for an evolution or favourite-Pokémon collection.',
    check: 'Match #44 and the edition. A common rarity symbol does not tell you the printing or condition.',
    collect: 'Pair with Base Set Ivysaur and Venusaur, or compare with the 151 version.',
  },
  'base1-63': {
    appeal: 'Base Set Squirtle begins the vintage Water-type partner line. It gives a Blastoise-centred collection context and a clear visual sequence.',
    check: 'Match #63 and its printing. Inspect the back as carefully as the front; edge wear is often more visible there.',
    collect: 'Add Wartortle and Blastoise from the same set.',
  },
  'sv3pt5-25': {
    appeal: '151 Pikachu revisits the mascot as a regular main-set card. It works well in a binder that follows Pikachu through different releases.',
    check: 'Match #25 and distinguish normal from reverse holo. Do not mix it with differently numbered Pikachu illustrations.',
    collect: 'Compare its artwork with Base Set Pikachu and the full-card Surging Sparks version.',
  },
  'sv3pt5-4': {
    appeal: 'The regular Charmander in 151. A small, approachable starting point for a collection built around the Charmander family.',
    check: 'Match #4 and the finish. The regular and reverse-holo versions belong in separate checklist slots if you collect both.',
    collect: 'Add 151 Charmeleon #5 and Charizard ex #6 for the main-set evolution line.',
  },
  'sv3pt5-1': {
    appeal: 'Bulbasaur opens 151’s main-set numbering. It suits a collector who enjoys completing a set in order or following the original partner Pokémon.',
    check: 'Match #1 and the normal or reverse-holo finish. Keep other Bulbasaur illustrations separate by collector number.',
    collect: 'Start a 151 checklist or compare this card with Base Set Bulbasaur.',
  },
};
