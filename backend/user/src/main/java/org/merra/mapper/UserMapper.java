package org.merra.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.merra.dto.UserPersonalInformationResponse;
import org.merra.entities.UserAccount;

@Mapper
public interface UserMapper {
    @Mappings({
        @Mapping(target = "isInformationFilled", expression = "java(userAccount.getFirstName() != null && !userAccount.getFirstName().isEmpty() && userAccount.getLastName() != null && !userAccount.getLastName().isEmpty())"),
        @Mapping(target = "userId", expression = "java(userAccount.getUserId().toString())"),
        @Mapping(target = "email", expression = "java(userAccount.getEmail())")
    })
    UserPersonalInformationResponse toUserPersonalInformationResponse(UserAccount userAccount);
}
