package org.merra.mapper;

import java.util.Set;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.Mappings;
import org.mapstruct.NullValueMappingStrategy;
import org.merra.dto.AccountByOrganizationResponse;
import org.merra.dto.AccountResponse;
import org.merra.entities.Account;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, nullValueMappingStrategy = NullValueMappingStrategy.RETURN_NULL)
public interface AccountMapper {
	@Mapping(target = "accountID", source = "accountId")
	@Mapping(target = "name", source = "accountName")
	AccountResponse toAccountResponse(Account account);
	
	Set<AccountResponse> toAccountResponses(Set<Account> accounts);
	
	Set<AccountByOrganizationResponse> toAccountByOrganizationResponses(Set<Account> accounts);
	
	@Mappings({
		@Mapping(target = "organizationID", source = "organization.id"),
		@Mapping(target = "accountID", source = "accountId"),
		@Mapping(target = "accountType", source = "accountType.name")
	})
	AccountByOrganizationResponse toAccountByOrganizationResponse(Account account);
}