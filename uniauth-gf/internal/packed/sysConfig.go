package packed

import "github.com/gogf/gf/v2/os/gres"

func init() {
	if err := gres.Add("H4sIAAAAAAAC/wrwZmYRYeBg4GBYaKAXzYAEhBg4GZLz89Iy0/UhlF5lYm5OaAgrAyN/9LGMngln/Y4oiLR+9/3F1yEd6/PSxzTZo8fYu1zNrmGn7naRpQ0F1pN/fFk2N2zuDInIu/MPP6yJ2dSnoaLZ8i23RY5bfmvAPs9HHVs9JPglwnvL115cfS0iRvDbQabEeXOnGZ2XYF6qtEzlZsWOPdqnJ/UXy19wNPB3mJsS42BwNPtT3q2lyhm9hTfP6p7fbPNbOfSxMlfu3nnOT2d+fbxXs+0oc5SapPm6r8vdPX42qiy2eLB/TujfyWbnRQSuTCj4FH7jUELmIZnqY2sK8yd9XHB599RmY4MAdfnM7WtXrdp1I1B43bXZuYFiqRunbTe/+izqjFadUUAEf9VJc74TX348lPU69v1kQ8W7Ay/5zqzJV2JaeGtySs26+AaL330mLF+XznjtafjIfELW43MR5yxrlGQLWwQfmZ+zPKVU4XHyW9zDvUacWd3cNz8V9+ifmM/IwPD/f4A3O8e83x4BrowMDHlMDAyw2GBgaDFGjQ02eGyAY6Ai4VgGSDOykgBvRiYRZkRkIhsMikwYWNIIIvFELcIg7O6AAAGG/459jAyYrmJlA0kzMTAxtDEwMJxmBPEAAQAA//+9rFapZwIAAA=="); err != nil {
		panic("add binary content to resource manager failed: " + err.Error())
	}
}
