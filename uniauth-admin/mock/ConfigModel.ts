// @ts-ignore
import { Request, Response } from "express";

export default {
  "DELETE /config/model": (req: Request, res: Response) => {
    res.status(200).send({ config: "H9@Ba" });
  },
  "POST /config/model": (req: Request, res: Response) => {
    res.status(200).send({ config: "!MDOxw" });
  },
  "PUT /config/model": (req: Request, res: Response) => {
    res.status(200).send({ config: "6AGk" });
  },
  "GET /config/model/all": (req: Request, res: Response) => {
    res.status(200).send({ config: "pdU#Z" });
  },
};
