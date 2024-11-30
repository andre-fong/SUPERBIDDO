interface ScryfallCard {
    object: string;
    id: string;
    name: string;
    set: string;
    collector_number: string;
    prices: {
        usd: string | null;
        usd_foil: string | null;
        eur: string | null;
    };
}

interface YGOCardSet {
    set_name: string;
    set_code: string;
    set_rarity: string;
    set_price: string;
    set_rarity_code: string;
}

export async function fetchCardPrice(cardType: string, cardName: string, setCode: string, collectorNumber: string, isFoil: boolean): Promise<string | null> {
    switch (cardType) {
        case "MTG":
            return fetchCardPriceMTG(setCode,  parseInt(collectorNumber, 10).toString(), isFoil);
        case "Yugioh":
            return fetchCardPriceYUGIOH(cardName, collectorNumber, setCode);
        case "Pokemon":
            return fetchCardPricePOKEMON(cardName, parseInt(collectorNumber, 10).toString(), setCode);
        default:
            return null;
    }
}

export async function fetchCardPriceMTG(setCode: string, collectorNumber: string, isFoil: boolean): Promise<string | null> {
    const url = `https://api.scryfall.com/cards/${setCode.toLowerCase()}/${collectorNumber}`;

    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Error fetching card data: ${response.statusText}`);
        }

        const cardData: ScryfallCard = await response.json();

        // Return the appropriate price based on the isFoil flag
        return isFoil ? cardData.prices.usd_foil : cardData.prices.usd;
    } catch (error) {
        console.error("Failed to fetch card data:", error);
        return null;
    }
}

export async function fetchCardPriceYUGIOH(cardName: string, collectorNumber: string, setCode?: string): Promise<string | null> {
    const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(cardName)}`;
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Error fetching card data: ${response.statusText}`);
        }

        const data = await response.json();
        const card: YGOCardSet  | undefined = data.data[0].card_sets.find((c: YGOCardSet ) => 
            (!setCode || c.set_code === collectorNumber)
        );

        if (card) {
            return card.set_price;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Failed to fetch card data:", error);
        return null;
    }
}

async function fetchCardPricePOKEMON(cardName: string, collectorNumber: string, setCode: string): Promise<string | null> {
    const url = `https://api.pokemontcg.io/v2/cards?q=name:${encodeURIComponent(cardName)}+set.id:${encodeURIComponent(setCode)}`
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Error fetching card data: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.count != 1) {
            console.log(`No card found with the name: ${cardName} and collector number: ${collectorNumber}`);
            return null;
        }

        const price = data.data[0].cardmarket.prices.averageSellPrice;
        
        return price;

    } catch (error) {
        console.error("Failed to fetch card data:", error);
        return null;
    }
}