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
  'base1-1': {
      "appeal": "Base Set Alakazam gives a Psychic-type collection one of its earliest holographic anchors, with an illustration credited to Ken Sugimori.",
      "check": "Match Base #1 and its holographic finish. Check the edition stamp, foil scratches and back-edge wear before comparing copies.",
      "collect": "Pair this with the 151 Alakazam ex prints to compare the original framed design with modern full-card artwork."
  },
  'base1-6': {
      "appeal": "Mitsuhiro Arita’s Base Set Gyarados brings the sea serpent into the original holographic lineup. A strong starting point for a Gyarados binder.",
      "check": "Match Base #6 and its holographic finish. Check the edition stamp, foil scratches and back-edge wear before comparing copies.",
      "collect": "Collect different Gyarados illustrations across eras, or display it beside the other original Base Set holographic Pokémon."
  },
  'base1-14': {
      "appeal": "Base Set Raichu gives a Pikachu collection its evolved counterpart in the original yellow-border, holographic format.",
      "check": "Match Base #14 and its holographic finish. Check the edition stamp, foil scratches and back-edge wear before comparing copies.",
      "collect": "Pair it with Base Set Pikachu #58, then compare both with the modern Pikachu illustrations already in the Vault."
  },
  'base1-16': {
      "appeal": "Ken Sugimori’s Base Set Zapdos offers a vintage interpretation of the Electric-type Legendary bird within the original holofoil frame.",
      "check": "Match Base #16 and its holographic finish. Check the edition stamp, foil scratches and back-edge wear before comparing copies.",
      "collect": "Compare it with the 151 Zapdos ex illustration, or start a page devoted to the three Legendary birds."
  },
  'base3-4': {
      "appeal": "Fossil Dragonite is the holographic version of Kagemaru Himeno’s vintage illustration. Its yellow-border design contrasts with later Dragonite V artwork.",
      "check": "Match Fossil #4 and its holographic finish. Check the edition stamp, foil scratches and back-edge wear before comparing copies.",
      "collect": "Pair it with Evolving Skies Dragonite V for a vintage-to-modern Dragonite display."
  },
  'base3-5': {
      "appeal": "Keiji Kinebuchi’s holographic Fossil Gengar gives a Gengar collection an early Ghost-type centrepiece.",
      "check": "Match Fossil #5 and its holographic finish. Check the edition stamp, foil scratches and back-edge wear before comparing copies.",
      "collect": "Display it beside Fusion Strike Gengar VMAX to compare the same Pokémon across two very different card eras."
  },
  'base3-2': {
      "appeal": "Fossil Articuno brings Mitsuhiro Arita’s illustration into an early holographic Legendary-bird collection.",
      "check": "Match Fossil #2 and its holographic finish. Check the edition stamp, foil scratches and back-edge wear before comparing copies.",
      "collect": "Pair it with Base Set Zapdos, or follow Articuno through its later illustrations and regional form."
  },
  'sv3pt5-198': {
      "appeal": "Yoriyuki Ikegami’s special illustration rare Venusaur ex completes the illustrated Bulbasaur evolution line in 151.",
      "check": "Match 151 #198 and the exact artwork. Other Venusaur ex printings have different collector numbers; inspect the surface and centering.",
      "collect": "Build a three-card display with Bulbasaur #166 and Ivysaur #167, all illustrated by Yoriyuki Ikegami."
  },
  'sv3pt5-200': {
      "appeal": "Mitsuhiro Arita’s special illustration rare Blastoise ex is the final stage of 151’s illustrated Squirtle family.",
      "check": "Match 151 #200 and the exact artwork. Other Blastoise ex printings have different collector numbers; inspect the surface and centering.",
      "collect": "Place it beside Squirtle #170 and Wartortle #171 for a three-card evolution page by the same illustrator."
  },
  'sv3pt5-201': {
      "appeal": "Shinya Komatsu’s special illustration rare Alakazam ex gives the Psychic-type Pokémon a full-card scene in 151.",
      "check": "Match 151 #201 and the exact artwork. Other Alakazam ex printings have different collector numbers; inspect the surface and centering.",
      "collect": "Compare it with the regular Alakazam ex #65 and Base Set Alakazam for three distinct approaches to the same Pokémon."
  },
  'sv3pt5-202': {
      "appeal": "The special illustration rare Zapdos ex brings Shiburingaru’s artwork across the full card, offering a modern Legendary-bird showcase.",
      "check": "Match 151 #202 and the exact artwork. Other Zapdos ex printings have different collector numbers; inspect the surface and centering.",
      "collect": "Pair it with Base Set Zapdos, or collect modern full-card illustrations of Legendary Pokémon."
  },
  'sv3pt5-3': {
      "appeal": "The regular Venusaur ex completes 151’s main-set Bulbasaur line in the Double Rare format, with artwork by 5ban Graphics.",
      "check": "Match 151 #3 and the exact artwork. Other Venusaur ex printings have different collector numbers; inspect the surface and centering.",
      "collect": "Combine Bulbasaur #1, Ivysaur #2 and Venusaur ex #3, then compare the line with its illustration versions."
  },
  'sv3pt5-9': {
      "appeal": "The regular Double Rare Blastoise ex features PLANETA Yamashita’s take on the original Water-type final evolution.",
      "check": "Match 151 #9 and the exact artwork. Other Blastoise ex printings have different collector numbers; inspect the surface and centering.",
      "collect": "Compare this main-set printing with Blastoise ex #200 and the vintage Base Set holographic Blastoise."
  },
  'sv3pt5-65': {
      "appeal": "Mitsuhiro Arita’s regular Alakazam ex brings the Psychic-type favourite into 151’s main-set Double Rare lineup.",
      "check": "Match 151 #65 and the exact artwork. Other Alakazam ex printings have different collector numbers; inspect the surface and centering.",
      "collect": "Compare the illustration with Alakazam ex #201, keeping the two collector numbers distinct in your checklist."
  },
  'sv3pt5-151': {
      "appeal": "The regular Mew ex closes the original Pokédex sequence in 151, with a Double Rare illustration credited to aky CG Works.",
      "check": "Match 151 #151 and the exact artwork. Other Mew ex printings have different collector numbers; inspect the surface and centering.",
      "collect": "Pair it with the gold Mew ex #205, or build a Mew page spanning 151, Fusion Strike and Paldean Fates."
  },
  'sv3pt5-166': {
      "appeal": "Yoriyuki Ikegami’s illustration rare Bulbasaur starts a complete illustrated evolution family within 151.",
      "check": "Match 151 #166 and the exact artwork. Other Bulbasaur printings have different collector numbers; inspect the surface and centering.",
      "collect": "Add Ivysaur #167 and Venusaur ex #198 to keep the whole evolution line and illustrator together."
  },
  'sv3pt5-167': {
      "appeal": "The illustration rare Ivysaur is the middle stage of Yoriyuki Ikegami’s three-card Bulbasaur family in 151.",
      "check": "Match 151 #167 and the exact artwork. Other Ivysaur printings have different collector numbers; inspect the surface and centering.",
      "collect": "Display it between Bulbasaur #166 and Venusaur ex #198, or compare it with Base Set Ivysaur."
  },
  'sv3pt5-168': {
      "appeal": "miki kudo’s illustration rare Charmander gives the beginning of the Charizard evolution line a full-card presentation.",
      "check": "Match 151 #168 and the exact artwork. Other Charmander printings have different collector numbers; inspect the surface and centering.",
      "collect": "Pair it with Charmeleon #169 and Charizard ex #199 for the illustrated 151 evolution line."
  },
  'sv3pt5-169': {
      "appeal": "miki kudo’s illustration rare Charmeleon connects Charmander with the final Charizard ex illustration in 151.",
      "check": "Match 151 #169 and the exact artwork. Other Charmeleon printings have different collector numbers; inspect the surface and centering.",
      "collect": "Use it as the middle card between Charmander #168 and Charizard ex #199 in an evolution display."
  },
  'sv3pt5-170': {
      "appeal": "Mitsuhiro Arita’s illustration rare Squirtle begins the illustrated Water-type starter family in 151.",
      "check": "Match 151 #170 and the exact artwork. Other Squirtle printings have different collector numbers; inspect the surface and centering.",
      "collect": "Add Wartortle #171 and Blastoise ex #200, or compare this Squirtle with its Stellar Crown illustration."
  },
  'sv3pt5-171': {
      "appeal": "The illustration rare Wartortle continues Mitsuhiro Arita’s Squirtle family, giving the middle evolution a full-card illustration of its own.",
      "check": "Match 151 #171 and the exact artwork. Other Wartortle printings have different collector numbers; inspect the surface and centering.",
      "collect": "Place it between Squirtle #170 and Blastoise ex #200 to complete the illustrated 151 family."
  },
  'sv3pt5-173': {
      "appeal": "Hiroyuki Yamamoto’s illustration rare Pikachu offers an art-focused alternative to the regular #25 printing in 151.",
      "check": "Match 151 #173 and the exact artwork. Other Pikachu printings have different collector numbers; inspect the surface and centering.",
      "collect": "Build a Pikachu page with Base Set #58, 151 #25 and Surging Sparks Pikachu ex #238."
  },
  'swsh7-180': {
      "appeal": "sowsow’s alternate-art Espeon V adds an illustrated scene to an Eeveelution collection within Evolving Skies.",
      "check": "Match Evolving Skies #180 and the exact artwork. Other Espeon V printings have different collector numbers; inspect the surface and centering.",
      "collect": "Compare this Espeon V with Fusion Strike Espeon VMAX, or collect the Eeveelution alternate arts together."
  },
  'swsh7-184': {
      "appeal": "Yuu Nishida’s alternate-art Sylveon V gives an Eeveelution binder a full-card illustration from Evolving Skies.",
      "check": "Match Evolving Skies #184 and the exact artwork. Other Sylveon V printings have different collector numbers; inspect the surface and centering.",
      "collect": "Pair it with Sylveon VMAX #212 and compare the different illustrators’ approaches to the same Pokémon."
  },
  'swsh7-189': {
      "appeal": "Teeziro’s alternate-art Umbreon V offers another full-card Umbreon illustration alongside the better-known VMAX printing.",
      "check": "Match Evolving Skies #189 and the exact artwork. Other Umbreon V printings have different collector numbers; inspect the surface and centering.",
      "collect": "Compare it with Umbreon VMAX #95 and #215, keeping each printing separate by collector number."
  },
  'swsh7-192': {
      "appeal": "Atsushi Furusawa’s alternate-art Dragonite V brings a full-card scene to a Dragonite collection in Evolving Skies.",
      "check": "Match Evolving Skies #192 and the exact artwork. Other Dragonite V printings have different collector numbers; inspect the surface and centering.",
      "collect": "Pair it with Fossil Dragonite #4 to compare a vintage holographic card with a modern alternate-art V."
  },
  'swsh7-212': {
      "appeal": "Taira Akitsu’s alternate-art Sylveon VMAX is a full-card Eeveelution showcase from Evolving Skies.",
      "check": "Match Evolving Skies #212 and the exact artwork. Other Sylveon VMAX printings have different collector numbers; inspect the surface and centering.",
      "collect": "Collect it alongside Glaceon VMAX #209 and Umbreon VMAX #215 for a set-focused Eeveelution page."
  },
  'swsh7-209': {
      "appeal": "kirisAki’s alternate-art Glaceon VMAX brings the Ice-type Eeveelution into Evolving Skies’ expansive VMAX illustrations.",
      "check": "Match Evolving Skies #209 and the exact artwork. Other Glaceon VMAX printings have different collector numbers; inspect the surface and centering.",
      "collect": "Pair it with Sylveon VMAX #212, or make a binder page dedicated to illustrated Eeveelution scenes."
  },
  'swsh7-218': {
      "appeal": "Anesaki Dynamic’s alternate-art Rayquaza VMAX offers a modern full-card counterpart to the EX Deoxys Gold Star Rayquaza.",
      "check": "Match Evolving Skies #218 and the exact artwork. Other Rayquaza VMAX printings have different collector numbers; inspect the surface and centering.",
      "collect": "Compare this printing with Rayquaza Gold Star #107 to show two different eras of Rayquaza collecting."
  },
  'swsh8-251': {
      "appeal": "Naoki Saito’s alternate-art Mew V gives a Mew collection a full-card scene from Fusion Strike.",
      "check": "Match Fusion Strike #251 and the exact artwork. Other Mew V printings have different collector numbers; inspect the surface and centering.",
      "collect": "Pair it with the XY Mew-EX promo and Paldean Fates Mew ex to compare three illustrators and card eras."
  },
  'swsh8-270': {
      "appeal": "Kouki Saitou’s alternate-art Espeon VMAX gives the Psychic-type Eeveelution a large-scale full-card illustration in Fusion Strike.",
      "check": "Match Fusion Strike #270 and the exact artwork. Other Espeon VMAX printings have different collector numbers; inspect the surface and centering.",
      "collect": "Display it alongside Evolving Skies Espeon V #180 or with the other alternate-art Eeveelution VMAX cards."
  },
  'swsh8-271': {
      "appeal": "sowsow’s alternate-art Gengar VMAX makes an expressive full-card centrepiece for a Gengar or Ghost-type collection.",
      "check": "Match Fusion Strike #271 and the exact artwork. Other Gengar VMAX printings have different collector numbers; inspect the surface and centering.",
      "collect": "Compare it with Fossil Gengar #5 to follow the Pokémon from vintage holofoil to the VMAX era."
  },
  'sv4pt5-232': {
      "appeal": "USGMEN’s special illustration rare Mew ex from Paldean Fates is often nicknamed “Bubble Mew” by collectors.",
      "check": "Match Paldean Fates #232 and the exact artwork. Other Mew ex printings have different collector numbers; inspect the surface and centering.",
      "collect": "Pair it with Fusion Strike Mew V and 151’s gold Mew ex for three distinct modern Mew art treatments."
  },
  'sv6-214': {
      "appeal": "akagi’s special illustration rare Greninja ex gives the Water-type fan favourite a full-card showcase in Twilight Masquerade.",
      "check": "Match Twilight Masquerade #214 and the exact artwork. Other Greninja ex printings have different collector numbers; inspect the surface and centering.",
      "collect": "Use it as the focal point of a Greninja page, or compare special illustration rares from different Scarlet & Violet sets."
  },
  'svp-44': {
      "appeal": "The Charmander #044 promo turns a moment at a window into a full-card illustration, with artwork by MINAMINAMI Take.",
      "check": "Match promo number 44 and the exact artwork. Promo numbering is separate from expansion numbering; inspect the surface, edges and corners.",
      "collect": "Pair it with Stellar Crown Bulbasaur #143 and Squirtle #148 for a three-starter display of everyday scenes."
  },
  'sv7-143': {
      "appeal": "Orca’s illustration rare Bulbasaur rests on a sunny windowsill among plants and Pidgey, giving the original starter an everyday setting.",
      "check": "Match Stellar Crown #143 and the exact artwork. Other Bulbasaur printings have different collector numbers; inspect the surface and centering.",
      "collect": "Pair it with Stellar Crown Squirtle #148 and Charmander promo #044 for a coordinated starter trio."
  },
  'sv7-148': {
      "appeal": "Saboteri’s illustration rare Squirtle splashes in a small pool with Pidgey nearby, turning a quiet afternoon into a full-card scene.",
      "check": "Match Stellar Crown #148 and the exact artwork. Other Squirtle printings have different collector numbers; inspect the surface and centering.",
      "collect": "Display it with Bulbasaur #143 and Charmander promo #044, or compare it with the 151 Squirtle illustration."
  },
  'swshp-SWSH262': {
      "appeal": "KIYOTAKA OSHIYAMA’s Charizard VSTAR promo gives a Charizard collection a dramatic full-card illustration from the Sword & Shield era.",
      "check": "Match promo number SWSH262 and the exact artwork. Promo numbering is separate from expansion numbering; inspect the surface, edges and corners.",
      "collect": "Pair it with Galarian Gallery Mewtwo VSTAR GG44 to compare the two sides of their illustrated confrontation."
  },
  'swsh12pt5gg-GG44': {
      "appeal": "GOSSAN’s Mewtwo VSTAR from the Galarian Gallery provides a full-card companion to the Charizard VSTAR SWSH262 promo.",
      "check": "Match Crown Zenith Galarian Gallery #GG44 and the exact artwork. Other Mewtwo VSTAR printings have different collector numbers; inspect the surface and centering.",
      "collect": "Display it with Charizard VSTAR SWSH262, or compare it with the original Base Set Mewtwo holographic card."
  },
  'xyp-XY126': {
      "appeal": "Eske Yoshinob’s Mew-EX XY126 promo adds a full-card illustration from the XY era to a collection following Mew through different releases.",
      "check": "Match promo number XY126 and the exact artwork. Promo numbering is separate from expansion numbering; inspect the surface, edges and corners.",
      "collect": "Compare it with Fusion Strike Mew V and Paldean Fates Mew ex for an art-led Mew binder page."
  },
};
