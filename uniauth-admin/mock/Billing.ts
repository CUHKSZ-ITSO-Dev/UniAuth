// @ts-ignore
import { Request, Response } from "express";

export default {
  "POST /billing/check": (req: Request, res: Response) => {
    res.status(200).send({ ok: true, err: "3T1m" });
  },
  "POST /billing/checkTokensUsage": (req: Request, res: Response) => {
    res.status(200).send({ tokensUsage: "SVk9P" });
  },
  "POST /billing/record": (req: Request, res: Response) => {
    res.status(200).send({ ok: true });
  },
};
