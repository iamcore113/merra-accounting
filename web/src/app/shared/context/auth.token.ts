import { HttpContextToken } from '@angular/common/http';

export const IS_AUTHENTICATED = new HttpContextToken<boolean>(() => false);