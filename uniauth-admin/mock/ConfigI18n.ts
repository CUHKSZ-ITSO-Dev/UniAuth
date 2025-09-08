// @ts-ignore
import { Request, Response } from "express";

export default {
  "DELETE /config/i18n": (req: Request, res: Response) => {
    res.status(200).send({ ok: true });
  },
  "GET /config/i18n": (req: Request, res: Response) => {
    res.status(200).send({
      langs: [
        "2eKOB&I",
        "3qT($L",
        "19ME(i",
        "%Yydps",
        "g^F",
        "Zo*KJ",
        "7PK5j",
        "pawj(It",
        "^veMKI",
      ],
    });
  },
  "POST /config/i18n": (req: Request, res: Response) => {
    res.status(200).send({ ok: true });
  },
  "PUT /config/i18n": (req: Request, res: Response) => {
    res.status(200).send({ ok: true });
  },
  "GET /config/i18n/:lang": (req: Request, res: Response) => {
    res.status(200).send({ config: {} });
  },
};
