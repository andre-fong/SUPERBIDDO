import express, { Request } from "express";
import axios from "axios";
import { BusinessError } from "../utils/errors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { qualityList, cardRarities } from "../types/geminiTypes";

function getGeminiString(): string {
  return `DONT PUT \`\`\`json at the start. Also never give an empty string for any of these in each json field.
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
                "quality": "Damaged",
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
                ${qualityList.join(
                  ", "
                )} PLEASE MAKE SURE TO ALWAYS GIVE A REPONSE FOR THIS GIVE YOUR BEST GUESS
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
        `;
}

function removeJsonFormatting(input) {
  let lines = input.trim().split("\n");

  if (lines[0].startsWith("```json")) {
    lines.shift();
  }
  if (lines[lines.length - 1].startsWith("```")) {
    lines.pop();
  }

  return lines.join("\n");
}

export const router = express.Router({ mergeParams: true });

router.get(
  "/",
  async (
    req: Request<
      {
        imageUrl: string;
      },
      any,
      {},
      {}
    >,
    res
  ) => {
    const imageUrl = req.params.imageUrl;
    let response;
    try {
      response = await axios.head(imageUrl);
    } catch (err) {
      throw new BusinessError(
        404,
        "Image not found",
        `Could not find referenced image at ${imageUrl}. Upload an image by posting to api/v_/images first.`
      );
    }
    const mimeType = response.headers["content-type"];

    const geminiApiKey = process.env.GEMINI_API_KEY;
    let imageResp: ArrayBuffer;
    imageResp = await axios
      .get(imageUrl, { responseType: "arraybuffer" })
      .then((response) => response.data);

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-pro" });

    const result = await model.generateContent([
      {
        inlineData: {
          data: Buffer.from(imageResp).toString("base64"),
          mimeType: mimeType,
        },
      },
      getGeminiString(),
    ]);
    const responseText = await removeJsonFormatting(result.response.text());
    res.json(JSON.parse(responseText));
  }
);
