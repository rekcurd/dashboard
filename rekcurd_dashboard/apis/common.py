from flask_restplus import fields


status_model = {
    'status': fields.Boolean(
        required=True
    ),
    'message': fields.String(
        required=True
    )
}


class DatetimeToTimestamp(fields.Raw):
    def format(self, value):
        return value.timestamp()


decimal_suffixes = {
    'm': 1.0e-3,
    'k': 1.0e+3,
    'M': 1.0e+6,
    'G': 1.0e+9,
    'T': 1.0e+12,
    'P': 1.0e+15,
    'E': 1.0e+18,
}


def kubernetes_cpu_to_float(cpu_str: str):
    """ Convert the Kubernetes CPU value to float """
    suffix = cpu_str[-1]
    if suffix.isnumeric():
        return float(cpu_str)
    elif suffix in decimal_suffixes.keys():
        value = float(cpu_str[:-1])
        return value * decimal_suffixes[suffix]
    else:
        raise ValueError(f'Please check the input CPU value: `{cpu_str}`')
