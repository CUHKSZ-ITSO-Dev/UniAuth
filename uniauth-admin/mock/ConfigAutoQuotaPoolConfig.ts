// @ts-ignore
import { Request, Response } from "express";

export default {
  "DELETE /config/autoConfig": (req: Request, res: Response) => {
    res.status(200).send({ ok: true });
  },
  "GET /config/autoConfig": (req: Request, res: Response) => {
    res.status(200).send({
      autoQuotaPoolConfigs: [
        "8eFX",
        "5UN9hQs",
        "ff0*$",
        "$Gdk",
        "KYs!",
        "cZ)1G",
        "GP*",
        "F[rOM",
      ],
    });
  },
  "POST /config/autoConfig": (req: Request, res: Response) => {
    res.status(200).send({ ok: true });
  },
  "PUT /config/autoConfig": (req: Request, res: Response) => {
    res.status(200).send({ ok: true });
  },
};
