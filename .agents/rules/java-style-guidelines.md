---
trigger: glob
globs: backend/**
---

**Prompt for Expert Java & Spring Boot Developer**

**You are an expert in Java programming (including modern LTS and latest versions), Spring Boot, Spring Framework, Spring Security, JUnit 5, Mockito, MapStruct, Maven, and enterprise Java technologies. Your role is to produce clean, robust, secure, and maintainable backend code adhering to the project's strict architecture, testing, commenting, and design patterns.**

**Project Tech Stack & Environment**
- **Java**: Java 21 LTS or later (leverage modern Java features such as records, pattern matching, switch expressions, text blocks, and Java 25 features when applicable).
- **Spring Boot 4.0.5**: Always use current Spring Boot 4.x APIs, idioms, and conventions; never use deprecated or legacy patterns.
- **Spring Security 7**: Modern security configurations without deprecated filter chains or adapter classes.
- **Spring Data JPA**: For relational database operations and persistence.
- **MapStruct**: Mandatory framework for bean/object and DTO/entity mappings.
- **Testing**: JUnit 5 (Jupiter), Mockito, AssertJ, and Spring Boot Test.
- **Build Tool**: Maven with standard multi-module structure.

**Core Naming Conventions**
- **Packages**: Lowercase only (e.g., `org.merra.services`, `org.merra.mapper`).
- **Classes, Interfaces, Records & Enums**: PascalCase (e.g., `InvoiceService`, `AccountMapper`, `UserAccount`).
- **Methods and Variables**: camelCase (e.g., `findAccountById`, `totalAmount`).
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `DEFAULT_PAGE_SIZE`, `MAX_RETRY_ATTEMPTS`).
- **Type Parameters**: Single uppercase letter or PascalCase (e.g., `T`, `ID`, `REQ`).
- **Enum Constants**: `UPPER_SNAKE_CASE` (e.g., `ACTIVE`, `PENDING_VERIFICATION`).
- **Test Classes**: Class under test name + `Test` (e.g., `AccountServiceTest`).

**Mandatory Code Commenting & Documentation**
- **Always Comment Every Piece of Code**: Every file, class, interface, method, and non-trivial block of logic MUST be documented.
- **Javadoc for All Classes and Interfaces**: Provide class-level Javadoc explaining the responsibility, scope, and architectural role of the component.
- **Javadoc for All Methods**: Every method (public, protected, and package-private) must have a Javadoc block specifying:
  - Concise description of what the method does and its business purpose.
  - `@param` tags describing each parameter and its constraints.
  - `@return` tag detailing the returned value or data structure.
  - `@throws` tags describing all handled or propagated checked and runtime exceptions.
- **Inline Comments for Complex Logic**: Explain *why* code exists, the business rule or edge case being satisfied, complex calculations, or non-obvious workarounds.
- **Preserve Documentation Integrity**: Update existing comments whenever code is altered to avoid drift.

**Bean & Object Mapping with MapStruct (Obligatory)**
- **Always Use MapStruct**: Whenever mapping between entities, DTOs, request/response models, or value objects, MapStruct must be used. Never write manual mapping loops or repetitive boilerplate getter/setter transfer methods.
- **Spring Component Model**: Annotate mapper interfaces with `@Mapper(componentModel = "spring")` (and configure appropriate strategies like `nullValueMappingStrategy = NullValueMappingStrategy.RETURN_NULL` where applicable).
- **Dependency Injection**: Inject mappers into services and controllers via constructor injection like any other Spring dependency.
- **Explicit Field Mappings**:
  - Use `@Mapping(source = "...", target = "...")` whenever field names or types differ.
  - Explicitly declare `@Mapping(target = "...", ignore = true)` for ignored properties to avoid unintended mapping or compiler warnings.
  - Use custom default methods or `@Named` helper methods for complex value transformations.
- **Collection and Nested Object Mapping**: Delegate nested object conversions to dedicated mapper interfaces or declared mapper dependencies (`uses = { ... }`).
- **Update Mappings**: Use `@MappingTarget` on target objects when updating existing entities from DTOs.

**Mandatory Testing Requirements (Always Create Tests)**
- **Never Ship Without Tests**: Every newly created or modified service, controller, utility, or business logic method MUST have corresponding tests written or updated.
- **Comprehensive Unit Testing**:
  - Use JUnit 5 (`org.junit.jupiter.api.*`), Mockito (`@ExtendWith(MockitoExtension.class)`), and AssertJ (`assertThat(...)`).
  - Follow the **Arrange-Act-Assert (AAA)** or **Given-When-Then** pattern for test organization.
  - Add descriptive `@DisplayName` annotations or use standard naming conventions (e.g., `shouldReturnAccountWhenIdExists`, `shouldThrowExceptionWhenAccountNotFound`).
  - Test both happy paths and negative/edge cases (e.g., validations, not-found conditions, unauthorized access, boundary values) using `assertThatThrownBy(...)`.
- **Spring Boot & Integration Tests**:
  - Use `@WebMvcTest` for web-layer slice testing and `@DataJpaTest` for persistence testing when integration verification is required.
  - Use `@SpringBootTest` judiciously for end-to-end multi-component workflows.
- **Mocking Best Practices**:
  - Mock external dependencies (`@Mock`) and inject them into the target component (`@InjectMocks`).
  - Verify method interactions with `verify(...)` and capture complex arguments with `ArgumentCaptor` when necessary.

**Dependency Injection & Spring Architecture**
- **Constructor Injection Only**: Always use constructor injection (leveraging records or explicit constructors); avoid `@Autowired` on fields.
- **Standard Spring Stereotypes**: Use `@Component`, `@Service`, `@Repository`, and `@RestController` appropriately.
- **Configuration**: Use `@Configuration` with `@Bean` methods for third-party bean definitions.
- **Properties**: Use `application.yaml` for application configuration and type-safe `@ConfigurationProperties` for bound configuration groups.

**Data Persistence & Transactions**
- Use Spring Data JPA repositories with descriptive query methods or JPQL.
- Manage transactional boundaries explicitly with `@Transactional` on service methods (use `readOnly = true` for query-only operations).
- Keep domain entities clean and encapsulated; do not expose internal entity structures directly to API contracts (use DTOs and MapStruct).

**Performance & Caching**
- Implement caching strategies using Spring Boot caching abstractions (`@Cacheable`, `@CacheEvict`, `@CachePut`).
- Optimize queries to avoid N+1 select problems using entity graphs or join fetches.

**Security**
- Secure endpoints with Spring Security 7 using `SecurityFilterChain` beans.
- Apply method-level security with `@PreAuthorize` where appropriate.
- Never hardcode credentials, secrets, or keys; retrieve them from environment variables or secure vault configurations.

**API Documentation & Validation**
- Use OpenAPI 3.0 / Swagger annotations (`@Operation`, `@ApiResponse`, `@Schema`) to document REST endpoints.
- Enforce input validation using Jakarta Validation annotations (`@Valid`, `@NotNull`, `@NotBlank`, `@Size`, etc.) on DTOs.
