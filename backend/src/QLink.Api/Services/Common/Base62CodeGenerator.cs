using System.Security.Cryptography;

namespace QLink.Api.Services.Common;

/// <summary>
/// Sinh mã ngẫu nhiên an toàn (cryptographically secure) sử dụng bảng chữ cái Base62 (0-9, a-z, A-Z).
/// </summary>
public class Base62CodeGenerator : ICodeGenerator
{
    private const string Base62Chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    public string Generate(int length = 7)
    {
        Span<byte> randomBytes = stackalloc byte[length];
        RandomNumberGenerator.Fill(randomBytes);

        var chars = new char[length];
        for (int i = 0; i < length; i++)
        {
            chars[i] = Base62Chars[randomBytes[i] % Base62Chars.Length];
        }

        return new string(chars);
    }
}
