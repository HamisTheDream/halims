import { ankpaData } from "./ankpaData";
import { omalaData } from "./omalaData";
import { olamaboroData } from "./olamaboroData";
import { bassaData } from "./bassaData";
import { dekinaData } from "./dekinaData";
import { ibajiData } from "./ibajiData";
import { idahData } from "./idahData";
import { igalamelaData } from "./igalamelaData";
import { ofuData } from "./ofuData";

export interface PollingUnit {
    name: string;
    code: string;
}

export interface Ward {
    name: string;
    pollingUnits: PollingUnit[];
}

export interface LGAData {
    name: string;
    wards: Ward[];
}

// Transform the flat arrays into structured LGA objects
function toLGA(name: string, data: { ward: string; pollingUnits: { name: string; code: string }[] }[]): LGAData {
    return {
        name,
        wards: data.map(d => ({ name: d.ward, pollingUnits: d.pollingUnits })),
    };
}

// Constituency data: LGAs → Wards → Polling Units for Kogi East Senatorial District
export const constituencyData: LGAData[] = [
    toLGA("Ankpa", ankpaData),
    toLGA("Bassa", bassaData),
    toLGA("Dekina", dekinaData),
    toLGA("Ibaji", ibajiData),
    toLGA("Idah", idahData),
    toLGA("Igalamela-Odolu", igalamelaData),
    toLGA("Ofu", ofuData),
    toLGA("Olamaboro", olamaboroData),
    toLGA("Omala", omalaData),
];