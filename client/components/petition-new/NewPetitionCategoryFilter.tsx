import { chakraComponent } from "@parallel/chakra/utils";
import { Button, Flex } from "@parallel/components/ui";
import { RadioProps, useRadio, useRadioGroup } from "@chakra-ui/react";
import { usePublicTemplateCategories } from "@parallel/utils/usePublicTemplateCategories";
import { ValueProps } from "@parallel/utils/ValueProps";
import { useIntl } from "react-intl";
import { isNonNullish } from "remeda";

interface NewPetitionCategoryFilterProps extends ValueProps<string> {
  categories: string[];
}

export const NewPetitionCategoryFilter = chakraComponent<"div", NewPetitionCategoryFilterProps>(
  function NewPetitionCategoryFilter({ ref, value, onChange, categories, ...props }) {
    const intl = useIntl();

    const allCategories = usePublicTemplateCategories();

    const options = [
      {
        label: intl.formatMessage({
          id: "generic.all-categories-short",
          defaultMessage: "All",
        }),
        slug: "all",
      },
      ...categories
        .map((value) => allCategories.find((c) => c.slug === value))
        .filter(isNonNullish),
    ];

    const { getRootProps, getRadioProps } = useRadioGroup({
      name: "categories",
      value: value ?? "all",
      onChange: (value: string) => onChange(value === "all" ? null : value),
    });

    const group = getRootProps();

    return (
      <Flex ref={ref} {...props} {...group} flexWrap="wrap" gridRowGap={2} gridColumnGap={3}>
        {options.map(({ slug, label }) => {
          const radio = getRadioProps({ value: slug });
          return (
            <CategoryRadio key={slug} {...(radio as RadioProps)}>
              {label}
            </CategoryRadio>
          );
        })}
      </Flex>
    );
  },
);

function CategoryRadio(props: RadioProps) {
  const { getInputProps, getRadioProps } = useRadio(props);

  const input = getInputProps();

  return (
    <Button
      rounded="full"
      size="sm"
      variant="outline"
      fontWeight="normal"
      as="label"
      htmlFor={input.id}
      cursor="pointer"
      _checked={{
        backgroundColor: "blue.500",
        borderColor: "blue.500",
        color: "white",
        fontWeight: "bold",
        _hover: {
          backgroundColor: "blue.600",
          borderColor: "blue.600",
        },
      }}
      {...getRadioProps()}
    >
      <input {...getInputProps()} />
      {props.children}
    </Button>
  );
}
