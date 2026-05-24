export interface UserPersonalInformationRequest {
    email: string;
    firstName: string;
    lastName: string;
    country: string;
}

// Corresponds to: backend/user/src/main/java/org/merra/dto/AuthenticatedUserProfile.java
export interface AuthenticatedUserProfile {
    id: string;
    gender: string;
    email: string;
    firstName: string;
    lastName: string;
    country: string;
}
