// @ts-ignore
import { Request, Response } from "express";

export default {
  "POST /auth/check": (req: Request, res: Response) => {
    res.status(200).send({ allow: true });
  },
  "POST /auth/checkEx": (req: Request, res: Response) => {
    res.status(200).send({
      allow: true,
      reason: [
        "f9kuC",
        "J%8t9",
        "x7SLe9",
        "i199tr",
        "9ExJ",
        "Azoxy",
        "hZ%bcD)",
        "Po26L1",
        "%LvK",
        "RYQ(x",
        "40[^[0",
        "Tyevz",
        "1^Qp",
        "CN)6WW",
        "L%@SX",
        "$St",
        "ctu[dm",
      ],
    });
  },
};
