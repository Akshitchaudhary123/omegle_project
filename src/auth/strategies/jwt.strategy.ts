// import { Injectable } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { ExtractJwt, Strategy } from 'passport-jwt';
// import { jwtConstants } from 'src/config/jwt.config';

// @Injectable()
// export class JwtStrategy extends PassportStrategy(Strategy) {
//   constructor() {
//     super({
//       jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//       ignoreExpiration: false,
//       secretOrKey: jwtConstants.secret,
//     });
//   }

//   async validate(payload: any) {
//     return { id: payload.sub, email: payload.email };
//   }
// }


import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { jwtConstants } from 'src/config/jwt.config';


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          //  Extract token from cookie
          return req?.cookies?.token || null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret, // use process.env.JWT_SECRET in real project
    });
  }

  async validate(payload: any) {
    // payload contains email and _id you signed
    return { _id: payload._id, email: payload.email };
  }
}
