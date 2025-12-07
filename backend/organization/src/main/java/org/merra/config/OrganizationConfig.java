package org.merra.config;

import java.util.Set;

import org.merra.entities.AccountCategory;
import org.merra.repositories.AccountCategoryRepository;
import org.merra.repositories.OrganizationTypeRepository;
import org.merra.utilities.AccountConstants;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OrganizationConfig implements CommandLineRunner {

	private final AccountCategoryRepository accountCategoryRepository;
	private final OrganizationTypeRepository organizationTypeRepository;

	public OrganizationConfig(AccountCategoryRepository accountCategoryRepository,
			OrganizationTypeRepository organizationTypeRepository) {
		this.accountCategoryRepository = accountCategoryRepository;
		this.organizationTypeRepository = organizationTypeRepository;
	}

	@Override
	public void run(String... args) throws Exception {
		// create account categories
		if (accountCategoryRepository.findAll().isEmpty()) {
			accountCategoryRepository.saveAll(Set.of(
					new AccountCategory(AccountConstants.ACC_CATEGORY_ASSET),
					new AccountCategory(AccountConstants.ACC_CATEGORY_EQUITY),
					new AccountCategory(AccountConstants.ACC_CATEGORY_EXPENSE),
					new AccountCategory(AccountConstants.ACC_CATEGORY_LIABILITY),
					new AccountCategory(AccountConstants.ACC_CATEGORY_REVENUE)));
		}

		// Add organization types
		if (organizationTypeRepository.findAll().isEmpty()) {
			organizationTypeRepository.saveAll(Set.of(
					new org.merra.entities.OrganizationType("INDIVIDUAL"),
					new org.merra.entities.OrganizationType("SOLE_TRADER"),
					new org.merra.entities.OrganizationType("PARTNERSHIP"),
					new org.merra.entities.OrganizationType("COMPANY"),
					new org.merra.entities.OrganizationType("TRUST"),
					new org.merra.entities.OrganizationType("ESTATE"),
					new org.merra.entities.OrganizationType("CLUB_OR_SOCIETY"),
					new org.merra.entities.OrganizationType("NOT_FOR_PROFIT"),
					new org.merra.entities.OrganizationType("GOVERNMENT_BODY"),
					new org.merra.entities.OrganizationType("OTHER")));
		}

	}

}
