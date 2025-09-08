// @ts-ignore
import { Request, Response } from "express";

export default {
  "POST /auth/check": (req: Request, res: Response) => {
    res.status(200).send({ allow: true });
  },
  "POST /auth/checkEx": (req: Request, res: Response) => {
    res
      .status(200)
      .send({ allow: false, reason: ["KO2O", "N1hcxV0", "emqQ([", "%Z3$A"] });
  },
  "GET /auth/quotaPools/all": (req: Request, res: Response) => {
    res.status(200).send({
      quotaPools: [
        "QMX",
        "4dULc",
        "APKnq",
        "2@0vG",
        "FW8UN#",
        "vIV^iq",
        "5qFo",
        "!I^(6Xs",
        "vUXl",
      ],
    });
  },
  "GET /auth/quotaPools/models": (req: Request, res: Response) => {
    res.status(200).send({
      availableModels: [
        "wvK0",
        "tiU",
        "ZifXa",
        "Z!I",
        "juUmZM3",
        "XZEh",
        "^B[hn",
        "f4&2u",
      ],
    });
  },
  "GET /auth/quotaPools/users": (req: Request, res: Response) => {
    res.status(200).send({
      users: [
        "ZtBx",
        "QOOf1",
        "XWn",
        "wtMFQg",
        "y1kh%$",
        "5iNZT",
        "Qn&N",
        "SE#(Bu",
        "PZkh2",
        "cB$D5",
        "Hgk)I4",
        "%E]ef6&",
        "UJJZq",
        "vFg3",
        "vpHhlR",
        "B[PU",
        "H%Q!",
        "@JH4B",
        "abhjX",
      ],
    });
  },
};
