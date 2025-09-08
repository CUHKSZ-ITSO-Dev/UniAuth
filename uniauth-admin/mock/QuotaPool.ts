// @ts-ignore
import { Request, Response } from "express";

export default {
  "DELETE /quotaPool": (req: Request, res: Response) => {
    res.status(200).send({ ok: true });
  },
  "GET /quotaPool": (req: Request, res: Response) => {
    res.status(200).send({ quotaPool: "4u8tF" });
  },
  "POST /quotaPool": (req: Request, res: Response) => {
    res.status(200).send({ ok: true });
  },
  "PUT /quotaPool": (req: Request, res: Response) => {
    res.status(200).send({ ok: false });
  },
};
