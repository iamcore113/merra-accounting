package org.merra.mapper;

import java.util.List;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.mapstruct.Named;
import org.merra.dto.UserOrganizationAffiliation;
import org.merra.repositories.projections.UserOrganizationAffiliations;

@Mapper(componentModel = "spring")
public interface OrganizationAffiliationMapper {

    /**
     * Maps a list of organization affiliation projections and a total count into a
     * {@link UserOrganizationAffiliation} response.
     *
     * @param affiliations the list of raw affiliation projections for the
     *                     authenticated user.
     * @param count        the total number of organizations the user is affiliated
     *                     with.
     * @return a {@link UserOrganizationAffiliation} containing the structured
     *         organization
     *         list and membership count.
     */
    @Mappings({
            @Mapping(target = "organizations", source = "affiliations", qualifiedByName = "mapOrganizationAffiliations"),
            @Mapping(target = "count", source = "count")
    })
    UserOrganizationAffiliation toUserOrganizationAffiliation(List<UserOrganizationAffiliations> affiliations,
            Long count);

    /**
     * Converts a list of {@link UserOrganizationAffiliations} projections into a
     * list of
     * {@link UserOrganizationAffiliation.Organizations} DTOs.
     *
     * @param affiliations the raw affiliation projections to transform.
     * @return a list of {@link UserOrganizationAffiliation.Organizations}
     *         containing
     *         the organization ID, display name, and the user's role in each
     *         organization.
     */
    @Named("mapOrganizationAffiliations")
    default List<UserOrganizationAffiliation.Organizations> mapOrganizationAffiliations(
            List<UserOrganizationAffiliations> affiliations) {
        return affiliations.stream()
                .map(affiliation -> new UserOrganizationAffiliation.Organizations(
                        affiliation.getOrganization().getId(),
                        affiliation.getOrganization().getDisplayName(),
                        affiliation.getRole()))
                .toList();
    }
}
