package org.merra.config;

import java.util.Set;

import org.merra.entities.AccountCategory;
import org.merra.repositories.AccountCategoryRepository;
import org.merra.utilities.AccountConstants;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OrganizationConfig implements CommandLineRunner {

	private final AccountCategoryRepository accountCategoryRepository;

	public OrganizationConfig(AccountCategoryRepository accountCategoryRepository) {
		this.accountCategoryRepository = accountCategoryRepository;
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
					new AccountCategory(AccountConstants.ACC_CATEGORY_REVENUE)
			));
		}
		
	}

}
