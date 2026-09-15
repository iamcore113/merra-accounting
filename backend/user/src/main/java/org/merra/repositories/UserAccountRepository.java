package org.merra.repositories;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.merra.entities.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserAccountRepository extends JpaRepository<UserAccount, UUID> {
    /**
     * Checks if all users specified by their UUIDs in the provided set exist in the
     * database.
     *
     * This query works by:
     * 1. Counting the number of User entities whose 'id' is present in the
     * ':userIds' set.
     * 2. Comparing this count to the actual size of the ':userIds' set using SpEL
     * (:#{#userIds.size()}).
     * 3. If the counts match, it means all users from the input set were found, and
     * the query returns TRUE.
     * 4. Otherwise, if the counts do not match (meaning some users were not found
     * or the set was empty and no users matched),
     * it returns FALSE.
     *
     * @param userIds A set of UUIDs representing the IDs of the users to check.
     * @return true if all users with the given IDs exist; false otherwise.
     */
    @Query("SELECT CASE WHEN COUNT(u.id) = :#{#userIds.size()} THEN TRUE ELSE FALSE END FROM UserAccount u WHERE u.id IN :userIds")
    boolean checkIfUsersExists(Set<UUID> userIds);

    /**
     * This will retrieve the current authenticated User object
     * 
     * @return - {@linkplain java.util.Optional} object of type
     *         {@linkplain UserAccount}
     */
    @Query("select u from UserAccount u where u.userId = ?#{ principal?.userId }")
    Optional<UserAccount> findAuthenticatedUser();

    /**
     * Retrieves the email address for a specific user ID.
     *
     * @param userId The unique identifier of the user account.
     * @return An {@link Optional} containing the email when the user exists;
     *         otherwise empty.
     */
    @Query("SELECT u.email FROM UserAccount u WHERE u.userId = :userId")
    Optional<String> findUserEmailById(UUID userId);

    /**
     * Finds a user account by email address using case-insensitive comparison.
     *
     * @param email The email address to search for.
     * @return An {@link Optional} containing the matching {@link UserAccount}, if
     *         found.
     */
    Optional<UserAccount> findUserByEmailIgnoreCase(String email);

    /**
     * Counts how many user accounts exist for the provided email.
     *
     * @param email The email address to check.
     * @return The number of matching user accounts for the given email.
     */
    @Query("SELECT COUNT(u) FROM UserAccount u WHERE u.email = :email")
    int existsByEmail(@Param("email") String email);
}
