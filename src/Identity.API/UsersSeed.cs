
namespace eShop.Identity.API;

public class UsersSeed(ILogger<UsersSeed> logger, UserManager<ApplicationUser> userManager) : IDbSeeder<ApplicationDbContext>
{
    public async Task SeedAsync(ApplicationDbContext context)
    {
        await CreateUser (
            "ava",
            "AvaZaczek@email.com",
            true,
            "Ava Zaczek",
            "XXXXXXXXXXXX1881",
            1,
            "New York",
            "U.S.",
            "12/24",
            "logged-in-ava", // Guid.NewGuid().ToString(),
            "Zaczek",
            "Ava",
            "1234567890",
            "98052",
            "NY",
            "15703 NE 61st Ct",
            "123",
            "Pass123$"
        );

        await CreateUser (
            "bob",
            "BobYates@email.com",
            true,
            "Bob Yates",
            "XXXXXXXXXXXX1881",
            1,
            "New York",
            "U.S.",
            "12/24",
            "logged-in-bob", // Guid.NewGuid().ToString(),
            "Yates",
            "Bob",
            "1234567890",
            "98052",
            "NY",
            "15703 NE 61st Ct",
            "456",
            "Pass123$"
        );

        await CreateUser (
            "charu",
            "CharuZutshi@email.com",
            true,
            "Charu Zutshi",
            "XXXXXXXXXXXX1881",
            1,
            "New York",
            "U.S.",
            "12/24",
            "logged-in-charu", // Guid.NewGuid().ToString(),
            "Zutshi",
            "Charu",
            "1234567890",
            "98052",
            "NY",
            "15703 NE 61st Ct",
            "789",
            "Pass123$"
        );

        await CreateUser (
            "danja",
            "DanjaWede@email.com",
            true,
            "Danja Wede",
            "XXXXXXXXXXXX1881",
            1,
            "New York",
            "U.S.",
            "12/24",
            "logged-in-danja", // Guid.NewGuid().ToString(),
            "Wede",
            "Danja",
            "1234567890",
            "98052",
            "WA",
            "15703 NE 61st Ct",
            "012",
            "Pass123$"
        );

        await CreateUser (
            "enam",
            "EnamVida@email.com",
            true,
            "Enam Vida",
            "XXXXXXXXXXXX1881",
            1,
            "New York",
            "U.S.",
            "12/24",
            "logged-in-enam", // Guid.NewGuid().ToString(),
            "Vida",
            "Enam",
            "1234567890",
            "98052",
            "NY",
            "15703 NE 61st Ct",
            "345",
            "Pass123$"
        );
    }

    private async Task CreateUser(
        string userName,
        string email,
        bool emailConfirmed,
        string cardHolderName,
        string cardNumber,
        int cardType,
        string city,
        string country,
        string expiration,
        string id,
        string lastName,
        string name,
        string phoneNumber,
        string zipCode,
        string state,
        string street,
        string securityNumber,
        string password
    )
    {
        var user = await userManager.FindByNameAsync(userName);

        if (user == null)
        {
            user = new ApplicationUser
            {
                UserName = userName,
                Email = email,
                EmailConfirmed = emailConfirmed,
                CardHolderName = cardHolderName,
                CardNumber = cardNumber,
                CardType = cardType,
                City = city,
                Country = country,
                Expiration = expiration,
                Id = id,
                LastName = lastName,
                Name = name,
                PhoneNumber = phoneNumber,
                ZipCode = zipCode,
                State = state,
                Street = street,
                SecurityNumber = securityNumber
            };

            var result = await userManager.CreateAsync(user, password);

            if (!result.Succeeded)
            {
                throw new Exception(result.Errors.First().Description);
            }

            if (logger.IsEnabled(LogLevel.Debug))
            {
                logger.LogDebug("{userName} created", userName);
            }
        }
        else
        {
            if (logger.IsEnabled(LogLevel.Debug))
            {
                logger.LogDebug("{userName} already exists", userName);
            }
        }
        
    }
}
