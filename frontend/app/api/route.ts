import { GoogleAIFileManager } from "@google/generative-ai/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import cardRarities, { qualityList } from "@/types/cardGameInfo";

// TODO: Move logic to backend express API
export async function POST(request: Request) {
  // TODO: Retrieve from .env
  const geminiApiKey = process.env.GEMINI_API_KEY || "";

  const fileManager = new GoogleAIFileManager(geminiApiKey);

  const uploadResult = await fileManager.uploadFile("app/api/818oG9FyRDL.jpg", {
    mimeType: "image/jpeg",
    displayName: "Sample Image",
  });

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  const result = await model.generateContent([
    `Give the answer in JUST JSON no backquotes or anything.
            {
                cardType: 
                manufacturer:
                quality:
                rarity:
                set: 
                foil:
                cardName:
                collectorNumber:
                setCode:
                type: "card"
                OR RETURN IT AS A BUNDLE LIKE THIS IF ITS NOT A CARD
                type: "bundle"
                cardType: 
                manufacturer:
                set: 
                collectorNumber:
                setCode:
                bundleName:
            } 
        Ex.
            {
                "cardType": "Yu-Gi-Oh!",
                "manufacturer": "Konami",
                "quality": "Mint",
                "rarity": "Secret Rare",
                "set": "Phantom Darkness",
                "foil": "Yes",
                "cardName": "Dark Armed Dragon"
                "collectorNumber": "PTDN-EN019"
                "setCode": "PTDN"
                "type": "card"
            },
            {
                "card-type": "Magic: The Gathering",
                "manufacturer": "Wizards of the Coast",
                "quality": "Near Mint",
                "rarity": "Mythic Rare",
                "set": "Theros Beyond Death",
                "setCode": "THB",
                "foil": "Yes",
                "cardName": "Elspeth, Conquering Hero"
                "collectorNumber": "9"
                "type": "card"
            },
            {
                "card-type": "Pokémon",
                "manufacturer": "The Pokémon Company",
                "quality": "PSA 10",
                "rarity": "Ultra Rare",
                "set": "Shining Legends",
                "foil": "Yes",
                "cardName": "Rayquaza" (Just the pokemon name not the full card name)
                "collectorNumber": "56"
                "setCode": "sm3.5" (set code in pokemon tcg api)
                "type": "card"
            },
            {
              "type": "bundle",
              "cardType": "Yu-Gi-Oh!",
              "manufacturer": "Konami",
              "set": "Legendary Collection",
              "collectorNumber": "LC01-EN001",
              "setCode": "LC01",
              "bundleName": "Legendary Collection Kaiba"
            },
            {
              "type": "bundle",
              "cardType": "Magic: The Gathering",
              "manufacturer": "Wizards of the Coast",
              "set": "Zendikar Rising",
              "collectorNumber": "60",
              "setCode": "ZNR",
              "bundleName": "Zendikar Rising Bundle"
            },
            {
              "type": "bundle",
              "cardType": "Pokémon",
              "manufacturer": "The Pokémon Company",
              "set": "Hidden Fates",
              "collectorNumber": "SV49",
              "setCode": "sm115",
              "bundleName": "Hidden Fates Elite Trainer Box"
            }
            NOTE
            If you return undefined for a value instead just return ''
            - type: The type of card or bundle
            - cardType: The type of card
                Return either:
                MTG
                Yugioh
                Pokemon 
            - manufacturer: The company that produced the card
            - quality: The condition of the card this only consist of
                ${qualityList.join(", ")}
            - rarity: The rarity of the card this only consist of
                ${Object.entries(cardRarities)
                  .map(
                    ([game, { rarities }]) => `${game}: ${rarities.join(", ")}`
                  )
                  .join("\n                ")}
            - set: The set the card is from (if applicable)
            - foil: Whether the card is a foil card (Yes or No)
            - cardName: The name of the card
            - collectorNumber: The collector number of the card
            - setCode: The set code of the card (For pokemon put the equivlient one for the pokemon tcg api)
            - For pokemon Only do the pure pokemon name not the full card name
            - bundleName: The name of the bundle
        `,
    {
      fileData: {
        fileUri: uploadResult.file.uri,
        mimeType: uploadResult.file.mimeType,
      },
    },
  ]);
  const responseText = await result.response.text();

  return Response.json({ response: JSON.stringify(JSON.parse(responseText)) });
}
